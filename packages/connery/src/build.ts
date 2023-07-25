import pkg from 'webpack';
import { existsSync } from 'fs';
import { logError, logErrorBody, logInfo, logSuccess } from './shared';

const sourceFilePath = './index.js';

export default async function (): Promise<void> {
  try {
    logInfo('🔨 Building connector...');
    await build();
    logSuccess('Build is successfully completed');
  } catch (error: any) {
    logError('Error occurred while building the connector');
    logErrorBody(error.message);
    return;
  }
}

function build(): Promise<void> {
  if (!existsSync(sourceFilePath)) {
    throw new Error(`The source file '${sourceFilePath}' is not found`);
  }

  const compiler = pkg.webpack({
    entry: sourceFilePath,
    mode: 'production',
    target: 'node',
    optimization: {
      minimize: true,
    },
    output: {
      library: {
        type: 'commonjs2',
      },
      filename: 'connector.js',
    },
  });

  return new Promise((resolve, reject) => {
    compiler.run((err) => {
      if (err) {
        reject(err);
      }

      compiler.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}
