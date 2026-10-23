package com.mazkiplay.agentoffice.workspace

import java.io.File
import java.nio.file.Files
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.util.zip.ZipInputStream
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LocalWorkspaceTest {
    private fun fixture(): Pair<File, LocalWorkspace> {
        val root = Files.createTempDirectory("mazki-workspace-test").toFile()
        return root to LocalWorkspace(root, testOnly = true)
    }

    @Test fun createsReadsListsAndSearchesRealFiles() {
        val (root, workspace) = fixture()
        try {
            assertEquals("Created notes/README.md", workspace.write("notes/README.md", "Mazkiplay local agent\n"))
            assertEquals("Mazkiplay local agent\n", workspace.read("notes/README.md"))
            assertTrue(workspace.list().contains("[DIR] notes"))
            assertEquals("Updated notes/README.md", workspace.write("notes/README.md", "Local workspace\n"))
            assertTrue(workspace.search("workspace").single().startsWith("notes/README.md:1:"))
        } finally { root.deleteRecursively() }
    }

    @Test fun rejectsTraversalAndWorkspaceRootAsWriteTarget() {
        val (root, workspace) = fixture()
        try {
            val outside = File(root.parentFile, "must-not-be-written-${root.name}")
            runCatching { workspace.write("../${outside.name}", "bad") }.onSuccess { error("Traversal should be rejected") }
            runCatching { workspace.write(".", "bad") }.onSuccess { error("Workspace root should not be a file target") }
            runCatching { workspace.read("../../etc/passwd") }.onSuccess { error("Outside file read should be rejected") }
            assertTrue(!outside.exists())
        } finally { root.deleteRecursively() }
    }

    @Test fun rejectsSymlinkEscapeForReadsAndSearch() {
        val (root, workspace) = fixture()
        val outside = Files.createTempFile("mazki-outside", ".txt")
        try {
            Files.write(outside, "private-marker".toByteArray())
            Files.createSymbolicLink(root.toPath().resolve("escape.txt"), outside)
            runCatching { workspace.read("escape.txt") }.onSuccess { error("Symlink escape should be rejected") }
            assertTrue(workspace.search("private-marker").isEmpty())
        } finally {
            root.deleteRecursively()
            Files.deleteIfExists(outside)
        }
    }

    @Test fun exportsActualWorkspaceFilesInZip() {
        val (root, workspace) = fixture()
        try {
            workspace.write("src/Main.kt", "fun main() = println(\"hello\")")
            val output = ByteArrayOutputStream()
            assertEquals(1, workspace.exportZip(output))
            val zip = ZipInputStream(ByteArrayInputStream(output.toByteArray()))
            val entry = zip.nextEntry
            assertEquals("src/Main.kt", entry.name)
            assertEquals("fun main() = println(\"hello\")", zip.bufferedReader().readText())
            zip.close()
        } finally { root.deleteRecursively() }
    }
}
