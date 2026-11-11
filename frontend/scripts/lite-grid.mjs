const pointPattern = /M(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)h0/g;

export function extractMap(source) {
  const header = source.match(/<svg[^>]*>/)?.[0];
  const viewBox = header?.match(/viewBox="([^"]+)"/)?.[1];
  const points = [...source.matchAll(pointPattern)].map((match) => ({
    x: Number(match[1]),
    y: Number(match[2]),
  }));

  if (!header || !viewBox || points.length === 0) {
    throw new Error("Full map SVG 구조 확인 불가");
  }

  return {
    header,
    points,
    viewBox,
    bounds: viewBox.split(" ").map(Number),
  };
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);

  return sorted[Math.floor(sorted.length / 2)];
}

function groupRows(points) {
  const rows = new Map();

  points.forEach((point) => {
    const row = rows.get(point.y) ?? [];

    row.push(point);
    rows.set(point.y, row);
  });

  return [...rows.entries()]
    .map(([y, row]) => ({ y, points: row.sort((left, right) => left.x - right.x) }))
    .sort((left, right) => left.y - right.y);
}

export function getOriginalGridSteps(points) {
  const rows = groupRows(points);
  const horizontalGaps = rows.flatMap(({ points: row }) => row
    .slice(1)
    .map((point, index) => point.x - row[index].x)
    .filter((gap) => gap > 0));
  const verticalGaps = rows
    .slice(1)
    .map((row, index) => row.y - rows[index].y)
    .filter((gap) => gap > 0);

  return {
    x: median(horizontalGaps),
    y: median(verticalGaps),
  };
}

function getBucketKey(x, y) {
  return `${x}:${y}`;
}

export function createSpatialHash(points, bucketSize) {
  const buckets = new Map();

  points.forEach((point) => {
    const bucketX = Math.floor(point.x / bucketSize);
    const bucketY = Math.floor(point.y / bucketSize);
    const key = getBucketKey(bucketX, bucketY);
    const bucket = buckets.get(key) ?? [];

    bucket.push(point);
    buckets.set(key, bucket);
  });

  return buckets;
}

export function isLandPoint(point, buckets, bucketSize, maxDistance) {
  const bucketX = Math.floor(point.x / bucketSize);
  const bucketY = Math.floor(point.y / bucketSize);
  const maxDistanceSquared = maxDistance ** 2;

  for (let y = bucketY - 1; y <= bucketY + 1; y += 1) {
    for (let x = bucketX - 1; x <= bucketX + 1; x += 1) {
      const bucket = buckets.get(getBucketKey(x, y));

      if (bucket?.some((source) => (
        (source.x - point.x) ** 2 + (source.y - point.y) ** 2 <= maxDistanceSquared
      ))) {
        return true;
      }
    }
  }

  return false;
}

export function createTriangularGrid(points, bounds, {
  maxDistance,
  originX = 0,
  originY = 0,
  stepX,
  stepY,
}) {
  const [minX, minY, width, height] = bounds;
  const buckets = createSpatialHash(points, maxDistance);
  const firstRow = Math.ceil((minY - originY) / stepY);
  const lastRow = Math.floor((minY + height - originY) / stepY);
  const selectedPoints = [];

  for (let row = firstRow; row <= lastRow; row += 1) {
    const y = originY + row * stepY;
    const offsetX = (row % 2) * stepX / 2;
    const firstColumn = Math.ceil((minX - originX - offsetX) / stepX);
    const lastColumn = Math.floor((minX + width - originX - offsetX) / stepX);

    for (let column = firstColumn; column <= lastColumn; column += 1) {
      const x = originX + column * stepX + offsetX;

      if (!isLandPoint({ x, y }, buckets, maxDistance, maxDistance)) continue;

      selectedPoints.push({
        x: Number(x.toFixed(3)),
        y: Number(y.toFixed(3)),
      });
    }
  }

  return selectedPoints;
}
