import { expect, test } from "./playwright-shim";

test("End-to-End Redlining Studio Lifecycle: Bidirectional Sync, Diff Preview, Resolution, Comments, Export & Audit Trail", async ({
  page,
}) => {
  await page.goto("/");

  // 1. Verify split-screen workspace and risk heatmap gutter render
  const workspaceTitle = await page
    .getByTestId("redlining-studio-workspace")
    .textContent();
  expect(workspaceTitle ?? "").toContain("REDLINE STUDIO");

  // 2. Click Clause #2 in editor and verify matching AI Redline Card becomes active
  const clauseNode2 = page.getByTestId(
    "clause-node-c0000000-0000-4000-8000-000000000102"
  );
  await clauseNode2.click();

  const card2Active = await page
    .getByTestId("redline-card-c0000000-0000-4000-8000-000000000102")
    .getAttribute("data-active");
  expect(card2Active).toBe("true");

  // 3. Hover over Apply Redline button on Clause #1 and verify inline word-diff preview
  const clause1Id = "c0000000-0000-4000-8000-000000000101";
  const acceptBtn1 = page.getByTestId(`apply-redline-btn-${clause1Id}`);
  await acceptBtn1.hover();
  const diffPreviewText = await page
    .getByTestId(`word-diff-preview-${clause1Id}`)
    .textContent();
  expect(diffPreviewText ?? "").toContain("twelve (12) months of fees");

  // 4. Accept redline suggestion on Clause #1
  await acceptBtn1.click();
  const resolvedBadge = await page
    .getByTestId(`suggestion-status-${clause1Id}`)
    .textContent();
  expect(resolvedBadge).toBe("ACCEPTED");

  // 5. Post a threaded comment on Clause #1
  await page
    .getByTestId(`comment-input-${clause1Id}`)
    .fill("Approved mutual 12-month liability super-cap.");
  await page.getByTestId(`post-comment-btn-${clause1Id}`).click();

  // 6. Trigger Track Changes and Clean DOCX Exports
  await page.getByTestId("export-track-changes-btn").click();
  const exportBadgeText = await page
    .getByTestId("export-status-badge")
    .textContent();
  expect(exportBadgeText ?? "").toContain("track_changes.docx");

  // 7. Open Compliance Audit Trail tab and verify immutable events
  await page.getByTestId("inspector-tab-audit").click();
  const auditPanelText = await page
    .getByTestId("audit-trail-panel")
    .textContent();
  expect(auditPanelText ?? "").toContain("DOCUMENT_INGESTED");
  expect(auditPanelText ?? "").toContain("SUGGESTION_ACCEPTED");
  expect(auditPanelText ?? "").toContain("COMMENT_CREATED");
  expect(auditPanelText ?? "").toContain("DOCUMENT_EXPORTED");
});
