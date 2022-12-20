const Cors = require("cors");
import { NextApiRequest, NextApiResponse } from "next";

// Initializing the cors middleware
const cors = Cors({
  methods: ["POST", "HEAD"],
  origin: "*",
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: (
    req: NextApiRequest,
    res: NextApiResponse,
    next: (err: any) => void
  ) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

export const runCors = (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<any> => runMiddleware(req, res, cors);
