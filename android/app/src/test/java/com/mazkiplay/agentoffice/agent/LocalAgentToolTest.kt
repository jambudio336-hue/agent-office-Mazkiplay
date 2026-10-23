package com.mazkiplay.agentoffice.agent

import com.mazkiplay.agentoffice.workspace.LocalWorkspace
import java.nio.file.Files
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LocalAgentToolTest {
    @Test fun declinedWriteReturnsSkippedAndLeavesWorkspaceUnchanged() = runBlocking {
        val root = Files.createTempDirectory("agent-tool-test").toFile()
        try {
            val workspace = LocalWorkspace(root, testOnly = true)
            val agent = LocalAgent(workspace)
            var approvalRequested = false
            val result = agent.executeTool("workspace_write", JSONObject().put("path", "README.md").put("content", "draft")) { _, _, replacing ->
                assertFalse(replacing)
                approvalRequested = true
                false
            }
            assertTrue(approvalRequested)
            assertEquals("SKIPPED", result.getString("status"))
            assertFalse(workspace.fileExists("README.md"))
        } finally { root.deleteRecursively() }
    }

    @Test fun approvedWritePersistsContentAndDetectsReplacement() = runBlocking {
        val root = Files.createTempDirectory("agent-tool-test").toFile()
        try {
            val workspace = LocalWorkspace(root, testOnly = true)
            workspace.write("README.md", "old")
            val agent = LocalAgent(workspace)
            val result = agent.executeTool("workspace_write", JSONObject().put("path", "README.md").put("content", "new")) { path, content, replacing ->
                assertEquals("README.md", path)
                assertEquals("new", content)
                assertTrue(replacing)
                true
            }
            assertEquals("OK", result.getString("status"))
            assertEquals("new", workspace.read("README.md"))
        } finally { root.deleteRecursively() }
    }

    @Test fun maliciousPathAndUnknownToolReturnHonestStatuses() = runBlocking {
        val root = Files.createTempDirectory("agent-tool-test").toFile()
        try {
            val agent = LocalAgent(LocalWorkspace(root, testOnly = true))
            val pathResult = agent.executeTool("workspace_read", JSONObject().put("path", "../../etc/passwd")) { _, _, _ -> false }
            assertEquals("INCONCLUSIVE", pathResult.getString("status"))
            val unknown = agent.executeTool("run_shell", JSONObject()) { _, _, _ -> false }
            assertEquals("NOT_SUPPORTED", unknown.getString("status"))
        } finally { root.deleteRecursively() }
    }
}
