import ErrorScenePage from "./error-scene-page";

// 실제 존재하지 않는 Public Route의 공통 404 Scene 구성
export default function NotFound() {
  return <ErrorScenePage code={404} />;
}
