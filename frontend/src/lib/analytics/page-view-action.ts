"use server";

import { recordInternalPageView } from "./internal-analytics";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PUBLIC_PATH = /^\/$|^\/projects\/[A-Za-z0-9_-]+$/;

// Browser 익명 UUID와 허용 Public pathname만 내부 Analytics로 전달
export async function recordPageView(visitorKey: string, path: string) {
  if (!UUID.test(visitorKey) || !PUBLIC_PATH.test(path)) {
    return;
  }
  await recordInternalPageView({ visitorKey, path });
}
