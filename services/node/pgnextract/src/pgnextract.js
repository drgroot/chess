import childProcess from 'child_process';
import log from './log';

const splitVariations = (inputpgn) => new Promise((resolve, reject) => {
  const process = childProcess.exec(`${__dirname}/pgn-extract -C -D --splitvariants`, (error, stdout, stderr) => {
    if (error) {
      log('[ERROR] error using split-extract', error);
      return reject(error);
    }

    log(stderr);

    return resolve(
      stdout
        .replace(/([^\]])\n\n/g, '$1|||')
        .split('|||')
        .filter((f) => f.trim().length > 0)
        .map((g) => g.trim().replace(/\s+(\*|1-0|0-1)$/, '')),
    );
  });

  process.stdin.write(inputpgn);
  process.stdin.end();
});

export default splitVariations;
