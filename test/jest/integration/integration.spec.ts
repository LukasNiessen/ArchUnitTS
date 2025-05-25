import "../../../jest"
import { filesOfProject } from "../../../src/files/fluentapi/files"

describe("Integration test", () => {
  it("checks the created messages", async () => {
    const rule = (await filesOfProject(__dirname + "/samples/filenamingsample/tsconfig.json"))
      .inFolder("services")
      .should()
      .matchPattern(".*Service\\.ts")

    // Changed to toPassAsync because it should pass the test
    await expect(rule).toPassAsync()
  })
})
