function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

module.exports = sleep;
module.exports.default = sleep;
