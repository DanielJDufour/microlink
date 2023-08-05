function chunk(arr, chunk_size) {
  const result = [];
  for (let i = 0; i < arr.length; i += chunk_size) {
    const chunk = [];
    for (let c = 0; c < chunk_size; c++) {
      const ii = i + c;
      if (ii < arr.length) {
        chunk.push(arr[ii]);
      }
    }
    result.push(chunk);
  }
  return result;
}

module.exports = chunk;
module.exports.default = chunk;
