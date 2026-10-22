function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getFrameSize(areaWidth, areaHeight, ratio, padding) {
  const gap = padding || 0;
  const maxWidth = Math.max(40, areaWidth - gap * 2);
  const maxHeight = Math.max(40, areaHeight - gap * 2);
  let width = maxWidth;
  let height = width / ratio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }
  return { width: Math.round(width), height: Math.round(height) };
}

function getOrientedSize(width, height, rotation) {
  const angle = ((Number(rotation) || 0) % 360 + 360) % 360;
  return angle === 90 || angle === 270
    ? { width: height, height: width }
    : { width, height };
}

function getBaseScale(frameWidth, frameHeight, sourceWidth, sourceHeight) {
  return Math.max(frameWidth / sourceWidth, frameHeight / sourceHeight);
}

function clampOffsets(offsetX, offsetY, frameWidth, frameHeight, sourceWidth, sourceHeight, scale) {
  const displayWidth = sourceWidth * scale;
  const displayHeight = sourceHeight * scale;
  const maxX = Math.max(0, (displayWidth - frameWidth) / 2);
  const maxY = Math.max(0, (displayHeight - frameHeight) / 2);
  return {
    offsetX: clamp(offsetX, -maxX, maxX),
    offsetY: clamp(offsetY, -maxY, maxY)
  };
}

function getSourceCrop(frameWidth, frameHeight, sourceWidth, sourceHeight, scale, offsetX, offsetY) {
  const width = Math.min(sourceWidth, frameWidth / scale);
  const height = Math.min(sourceHeight, frameHeight / scale);
  const imageLeft = (frameWidth - sourceWidth * scale) / 2 + offsetX;
  const imageTop = (frameHeight - sourceHeight * scale) / 2 + offsetY;
  const left = clamp(-imageLeft / scale, 0, sourceWidth - width);
  const top = clamp(-imageTop / scale, 0, sourceHeight - height);
  return { left, top, width, height };
}

function getOutputSize(cropWidth, cropHeight, maxEdge) {
  const limit = maxEdge || 2560;
  let width = Math.min(cropWidth, limit);
  let height = width * cropHeight / cropWidth;
  if (height > limit) {
    height = limit;
    width = height * cropWidth / cropHeight;
  }
  return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) };
}

function getZoomedOffset(offsetX, offsetY, oldScale, newScale, pointX, pointY) {
  const anchorX = pointX || 0;
  const anchorY = pointY || 0;
  const sourceX = (anchorX - offsetX) / oldScale;
  const sourceY = (anchorY - offsetY) / oldScale;
  return {
    offsetX: anchorX - sourceX * newScale,
    offsetY: anchorY - sourceY * newScale
  };
}

module.exports = {
  clamp,
  getFrameSize,
  getOrientedSize,
  getBaseScale,
  clampOffsets,
  getSourceCrop,
  getOutputSize,
  getZoomedOffset
};
