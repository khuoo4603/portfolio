import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";
import {
  createQuiz,
  deleteQuiz,
  getQuiz,
  getQuizzes,
  getToolLinks,
  getTools,
  updateQuiz,
} from "./tools-api";

vi.mock("@/lib/api/client", () => ({ apiRequest: vi.fn() }));

describe("Tools API", () => {
  afterEach(() => vi.clearAllMocks());

  it("활성 Tool과 전체 Link 배열을 Query 없이 조회", async () => {
    await getTools();
    await getToolLinks();

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/tools");
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/tools/links");
  });

  it("Quiz 목록·신규·상세·수정·삭제 Endpoint를 그대로 사용", async () => {
    const payload = {
      title: "Fixture Quiz",
      quizJson: { questions: [] },
      responseJson: { 0: ["1"] },
    };

    await getQuizzes();
    await createQuiz(payload);
    await getQuiz(7);
    await updateQuiz(7, payload);
    await deleteQuiz(7);

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/tools/quizzes");
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/tools/quizzes", { method: "POST", json: payload });
    expect(apiRequest).toHaveBeenNthCalledWith(3, "/tools/quizzes/7");
    expect(apiRequest).toHaveBeenNthCalledWith(4, "/tools/quizzes/7", { method: "PATCH", json: payload });
    expect(apiRequest).toHaveBeenNthCalledWith(5, "/tools/quizzes/7", { method: "DELETE" });
  });
});
