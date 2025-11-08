export const getProcessedImageData = (ctx, size) => {
  const imageCoords = [];

  const data = ctx.getImageData(0, 0, size, size).data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const alpha = data[(size * y + x) * 4 + 3];

      if (alpha > 0) {
        imageCoords.push([10 * (x - size / 2), 10 * (y - size / 2)]);
      }
    }
  }

  return imageCoords;
};

export const fillImageDataToNext = (currentImageData, nextImageData) => {
  const cid = currentImageData.flat().concat([]);
  const nid = nextImageData.flat().concat([]);

  if (nid.length <= cid.length) {
    const data = [];
    for (let i = 0; i < nid.length; ) {
      data.push([nid[i], nid[i + 1]]);
      i += 2;
    }
    return data;
  }

  const diff = nid.length - cid.length;
  for (let i = 0; i < Math.floor(diff / 2); i++) {
    const el = nid[cid.length + i];

    cid.push(el);
  }

  const data = [];
  for (let i = 0; i < cid.length; ) {
    data.push([cid[i], cid[i + 1]]);
    i += 2;
  }

  return data;
};
