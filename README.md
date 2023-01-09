# @worldcoin/cdk
Contains commonly used constructs, stacks and various helpers.

## Install
### Add subtree
Use [`git-subtree`](https://github.com/git/git/blob/master/contrib/subtree/git-subtree.txt) to add the `@worldcoin/cdk` to your repo:
```sh
git subtree add --prefix @worldcoin/cdk https://github.com/worldcoin/cdk main --squash
```

The command above creates a nested dir `@worldcoin/cdk/` in your repo, with all the code copied from the `main` branch of `@worldcoin/cdk` repo.

> ⚠️ It is important for `@worldcoin/cdk` to be located under the cdk app's node modules resolution path and doesn't install its own node modules, so that it imports the same node modules. E.g. if cdk app is located in `infrastructure/`, then add sbutree to `infrastructure/@worldcoin/cdk/`.

> ⚠️ `git-subtree` merges a code from remote repo right into the git tree of a host repo. Any changes to subtree repo will be highlighted as the host repo changes. Be careful with such changes, as they can then be submitted to subtree repo.

### Add TS path alias
Add new path to `tsconfig.ts:paths` in the host repo:
```json
"paths": {
  "@worldcoin/cdk/*": ["@worldcoin/cdk/src/*"]
}
```

## Use
Once installation's complete you can import a code from `@worldcoin/cdk` in the following way:
```typescript
import {LambdaFunction} from '@worldcoin/cdk/lambda/lambda-function'
```

## Update
An update to fresh version of `@worldcoin/cdk` can be done by pulling the code from the repo:
```sh
git subtree pull --prefix @worldcoin/cdk https://github.com/worldcoin/cdk main --squash
```

> 💡 Any changes to a subtree repo within a host repo are submitted to the host repo as a regular commit. Which means they will be immediately available to the host repo users right after `git-pull`.

> ⚠️ It will merge the code to the host repo tree, just like a regular `git-pull` does. Which means that potentially you will have to resolve conflicts, if you had uncommited changes in the subtree repo.

## Contribute
Whenever you need to introduce new functionality, bug fixes, or any other changes to `@worldcoin/cdk`, you are free to do this right from within the host repo. Modify the code, push it to a branch in subtree repo and submit a pull request.

To push a code from `@worldcoin/cdk` navigate to the root of a host repo and run the following command:
```sh
git subtree push --prefix @worldcoin/cdk https://github.com/worldcoin/cdk <new-branch>
```
