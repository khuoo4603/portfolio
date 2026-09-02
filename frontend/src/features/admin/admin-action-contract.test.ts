import { describe, expect, it } from "vitest";
import { accountActionBindings } from "./admin-account-api";
import type { AdminActionBinding } from "./admin-action-api";
import { projectActionBindings } from "./admin-project-api";
import { siteActionBindings } from "./admin-site-api";

// Site·Project·Account Critical 20개 작업의 단일 Binding 계약 검증
describe("ADMIN_ACTION 전체 Binding 계약", () => {
  it("Critical 20개 operation과 8개 target만 사용하고 Tool 작업을 포함하지 않음", () => {
    const bindings: AdminActionBinding[] = [
      siteActionBindings.portfolioContentUpdate(),
      siteActionBindings.profileEntryCreate(),
      siteActionBindings.profileEntryUpdate(11),
      siteActionBindings.profileEntryDelete(11),
      siteActionBindings.resumeReplace(),
      siteActionBindings.technologyCreate(),
      siteActionBindings.technologyUpdate(12),
      siteActionBindings.technologyDelete(12),
      siteActionBindings.portfolioTechnologyUpdate(),
      siteActionBindings.externalLinkCreate(),
      siteActionBindings.externalLinkUpdate(13),
      siteActionBindings.externalLinkDelete(13),
      projectActionBindings.create(),
      projectActionBindings.update(14),
      projectActionBindings.delete(14),
      projectActionBindings.status(14),
      accountActionBindings.create(),
      accountActionBindings.status(15),
      accountActionBindings.role(15),
      accountActionBindings.password(15),
    ];

    expect(bindings.map((binding) => binding.operation)).toEqual([
      "PORTFOLIO_CONTENT_UPDATE",
      "PROFILE_ENTRY_CREATE",
      "PROFILE_ENTRY_UPDATE",
      "PROFILE_ENTRY_DELETE",
      "RESUME_REPLACE",
      "TECHNOLOGY_CREATE",
      "TECHNOLOGY_UPDATE",
      "TECHNOLOGY_DELETE",
      "PORTFOLIO_TECHNOLOGY_UPDATE",
      "EXTERNAL_LINK_CREATE",
      "EXTERNAL_LINK_UPDATE",
      "EXTERNAL_LINK_DELETE",
      "PROJECT_CREATE",
      "PROJECT_UPDATE",
      "PROJECT_DELETE",
      "PROJECT_STATUS_UPDATE",
      "ACCOUNT_CREATE",
      "ACCOUNT_STATUS_UPDATE",
      "ACCOUNT_ROLE_UPDATE",
      "ACCOUNT_PASSWORD_RESET",
    ]);
    expect(new Set(bindings.map((binding) => binding.operation)).size).toBe(20);
    expect(new Set(bindings.map((binding) => binding.targetType))).toEqual(new Set([
      "PORTFOLIO_CONTENT",
      "PROFILE_ENTRY",
      "RESUME",
      "TECHNOLOGY",
      "PORTFOLIO_TECHNOLOGY",
      "EXTERNAL_LINK",
      "PROJECT",
      "ACCOUNT",
    ]));
    expect(bindings.every((binding) => !binding.operation.startsWith("TOOL"))).toBe(true);
  });
});
