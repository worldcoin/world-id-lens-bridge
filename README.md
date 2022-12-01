This is a simple microservice that receives the phone or orb signal from [IDKit JS](https://github.com/worldcoin/idkit-js) on Lens-powered apps, verifies the signal and submits it via a simple webhook to the Lens API.

## Local development

1. Install deps
    ```bash
    yarn
    ```

2. Run locally
    ```bash
    yarn dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

This microservice is deployed on Vercel.