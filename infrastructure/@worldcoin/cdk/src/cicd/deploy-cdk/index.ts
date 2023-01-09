import * as cdk from 'aws-cdk-lib'
import {Construct} from 'constructs'
import {NagSuppressions} from 'cdk-nag'

type EnvironmentVariables = Record<string, {
  type: cdk.aws_codebuild.BuildEnvironmentVariableType,
  value: string,
}>

export class DeployCdk extends Construct {
  readonly buildComputeType?: cdk.aws_codebuild.ComputeType
  readonly buildEnvironmentVariables?: EnvironmentVariables
  readonly buildProjectRole: cdk.aws_iam.Role
  readonly installCommands?: Array<string>
  readonly preBuildCommands?: Array<string>
  readonly postBuildCommands?: {deploy?: Array<string>, diff?: Array<string>}

  constructor(scope: Construct, id: string, props: {
    readonly branch: string
    readonly buildComputeType?: cdk.aws_codebuild.ComputeType
    readonly buildEnvironmentVariables?: EnvironmentVariables
    readonly githubOauthToken: cdk.SecretValue
    readonly installCommands?: Array<string>
    readonly isApproveRequired?: boolean
    readonly preBuildCommands?: Array<string>
    readonly postBuildCommands?: {deploy?: Array<string>, diff?: Array<string>}
    readonly repoNameToDeployFrom: {owner: string, repo: string}
  } & ({
    readonly isSlackNotificationsEnabled: true
    readonly slackTarget: cdk.aws_chatbot.SlackChannelConfiguration
  } | {
    readonly isSlackNotificationsEnabled?: false
    slackTarget?: undefined
  })) {
    super(scope, id)
    const sourceOutput = new cdk.aws_codepipeline.Artifact('SourceArtifact')
    this.installCommands = props.installCommands
    this.preBuildCommands = props.preBuildCommands
    this.postBuildCommands = props.postBuildCommands
    this.buildEnvironmentVariables = props.buildEnvironmentVariables
    this.buildComputeType = props.buildComputeType

    // ANCHOR Pipeline
    const pipeline = new cdk.aws_codepipeline.Pipeline(scope, 'DeployCdkPipeline', {
      enableKeyRotation: true,
      pipelineName: 'DeployCdkWithApprove',

      stages: [
        // ANCHOR Fetch the code from GitHub
        {stageName: 'Source', actions: [
          new cdk.aws_codepipeline_actions.GitHubSourceAction({
            actionName: 'Source',
            branch: props.branch,
            owner: props.repoNameToDeployFrom.owner,
            repo: props.repoNameToDeployFrom.repo,
            oauthToken: props.githubOauthToken,
            output: sourceOutput,
            trigger: cdk.aws_codepipeline_actions.GitHubTrigger.WEBHOOK,
          }),
        ]},

        // ANCHOR Deploy after approval
        {
          stageName: 'ApproveAndDeploy',

          actions: [
            ...props.isApproveRequired ? [
              new cdk.aws_codepipeline_actions.CodeBuildAction({
                actionName: 'DiffCdk',
                project: this.initCdkCommandBuildProject('diff'),
                input: sourceOutput,
                runOrder: 1,
              }),

              // TODO Provide the URL for review, which is a DiffCdk action output
              new cdk.aws_codepipeline_actions.ManualApprovalAction({
                actionName: 'ApproveDeploy',
                additionalInformation: 'Review required. Check the diff and approve/reject the deployment.',

                // TODO Find a less naive way to generate URL
                externalEntityLink: 'https://us-east-1.console.aws.amazon.com/codesuite/codepipeline/pipelines/DeployCdkWithApprove/view?region=us-east-1',

                runOrder: 2,
              }),
            ] : [],

            new cdk.aws_codepipeline_actions.CodeBuildAction({
              actionName: 'DeployCdk',
              project: this.initCdkCommandBuildProject('deploy'),
              input: sourceOutput,
              runOrder: 3,
            }),
          ],
        },
      ],
    })

    // ANCHOR Slack notifications
    if(props.isSlackNotificationsEnabled) {
      new cdk.aws_codestarnotifications.NotificationRule(this, 'ApprovalNeededNotificationRule', {
        source: pipeline,

        events: [
          'codepipeline-pipeline-manual-approval-needed',
          'codepipeline-pipeline-pipeline-execution-failed',
          'codepipeline-pipeline-pipeline-execution-succeeded',
        ],

        targets: [props.slackTarget],
      })
    }

    // ANCHOR NAG suppressions
    NagSuppressions.addResourceSuppressions(
      pipeline,
      [{id: 'AwsSolutions-IAM5', reason: 'The pipeline manages buckets and KMS keys on its own.'}],
      true,
    )

    NagSuppressions.addResourceSuppressions(
      pipeline.artifactBucket,
      [{id: 'AwsSolutions-S1', reason: 'Artifacts are stored in short lived bucket.'}],
      true,
    )
  }

  private initCdkCommandBuildProject(command: 'diff' | 'deploy'): cdk.aws_codebuild.PipelineProject {
    const buildProject = new cdk.aws_codebuild.PipelineProject(this, `CdkCodeBuildProject-${command}`, {
      buildSpec: cdk.aws_codebuild.BuildSpec.fromObject({
        version: '0.2',

        phases: {
          install: {
            // TODO Multiple installation steps should go away once we move on to pnpm
            /* FIXME
            This is not optimal implementation, deploy action must start with the artifact generated by diff. But sharing
            installed node modules through artifact doesn't work properly. For some reason cdk CLI fails with different
            errors. Potentially can be that some files are missing from the artifact. Repeat the install phase
            for now in all projects.
            */
            commands: ['npm install --global aws-cdk', ...this.installCommands || []],
          },

          ...this.preBuildCommands && {pre_build : {commands: this.preBuildCommands}},

          build: {
            commands: [
              `cdk ${command} --all --context stage=${this.node.tryGetContext('env').stage} --require-approval never`,
            ],
          },

          post_build: {
            commands: this.postBuildCommands?.[command] || []
          }
        },
      }),
      environment: {
        buildImage: cdk.aws_codebuild.LinuxBuildImage.STANDARD_6_0,
        computeType: this.buildComputeType || cdk.aws_codebuild.ComputeType.MEDIUM,

        // Required to launch Docker daemon
        privileged: true,
      },
      environmentVariables: {
        // Required for docker build command
        DOCKER_BUILDKIT: {value: '1'},

        ...this.buildEnvironmentVariables,
      },
    })

    // ANCHOR Allow assuming to CDK roles
    const deployRole = cdk.aws_iam.Role.fromRoleArn(this, `DeployRole-${command}`, this.cdkRoleArn('deploy'))
    const imagePublishingRole = cdk.aws_iam.Role.fromRoleArn(this, `ImagePublishingRole-${command}`, this.cdkRoleArn('image-publishing'))
    const filePublishingRole = cdk.aws_iam.Role.fromRoleArn(this, `FilePublishingRole-${command}`, this.cdkRoleArn('file-publishing'))
    const lookupRole = cdk.aws_iam.Role.fromRoleArn(this, `LookupRole-${command}`, this.cdkRoleArn('lookup'))
    deployRole.grantAssumeRole(buildProject.role!.grantPrincipal)
    imagePublishingRole.grantAssumeRole(buildProject.role!.grantPrincipal)
    filePublishingRole.grantAssumeRole(buildProject.role!.grantPrincipal)
    lookupRole.grantAssumeRole(buildProject.role!.grantPrincipal)

    // ANCHOR NAG suppressions
    /* TODO
      Ideally the artifact bucket, corresponding KMS keys, and build role must be added manually, along with granular
      permissions. Currently the build role is granted with too wide permissions which can be exploited by the code from
      the repo (e.g. npm-scripts).
    */
    NagSuppressions.addResourceSuppressions(
      buildProject.role!,
      [{id: 'AwsSolutions-IAM5', reason: 'The build project manages buckets and KMS keys on its own.'}],
      true,
    )

    NagSuppressions.addResourceSuppressions(
      buildProject,
      [{id: 'AwsSolutions-CB3', reason: 'Priveleged mode required to build Docker containers.'}],
      true,
    )

    return buildProject
  }

  private cdkRoleArn(roleName: 'deploy' | 'image-publishing' | 'file-publishing' | 'lookup') {
    const accountId = this.node.tryGetContext('env').account
    const accountQualifier = this.node.tryGetContext('@aws-cdk/core:bootstrapQualifier')
    return `arn:aws:iam::${accountId}:role/cdk${accountQualifier ? `-${accountQualifier}` : ''}-${roleName}-role-${accountId}-${this.node.tryGetContext('env').region}`
  }
}
