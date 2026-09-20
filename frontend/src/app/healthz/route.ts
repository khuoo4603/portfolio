// Frontend Server Process 전용 무상태 Health 응답
export function GET() {
  return Response.json(
    { status: "UP" },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
