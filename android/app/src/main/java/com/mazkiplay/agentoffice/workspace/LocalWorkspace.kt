package com.mazkiplay.agentoffice.workspace

import android.content.Context
import java.io.File
import java.io.OutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

/** Project workspace stored inside the app sandbox; no broad storage permission is requested. */
class LocalWorkspace private constructor(workspaceRoot: File) {
    constructor(context: Context) : this(File(context.filesDir, "agent-workspace"))

    internal constructor(workspaceRoot: File, testOnly: Boolean = true) : this(workspaceRoot)

    val root: File = workspaceRoot.canonicalFile.apply { mkdirs() }

    fun list(path: String = ""): List<String> {
        val directory = resolve(path)
        require(directory.isDirectory) { "Not a directory: $path" }
        return directory.listFiles().orEmpty().sortedBy { it.name.lowercase() }.take(MAX_ENTRIES).map {
            (if (it.isDirectory) "[DIR] " else "[FILE] ") + relative(it)
        }
    }

    fun read(path: String): String {
        val file = resolve(path)
        require(file.isFile) { "File not found: $path" }
        require(file.length() <= MAX_FILE_BYTES) { "File exceeds the ${MAX_FILE_BYTES / 1024} KB read limit." }
        return file.readText(Charsets.UTF_8)
    }

    fun fileExists(path: String): Boolean = resolve(path).let { it.exists() && it.isFile }

    fun write(path: String, content: String): String {
        require(path.trim().isNotEmpty() && path.trim() != "." && path.trim() != "/") { "A file path is required." }
        val file = resolve(path)
        require(file != root) { "The workspace root is not a file." }
        require(content.toByteArray(Charsets.UTF_8).size <= MAX_FILE_BYTES) { "File exceeds the ${MAX_FILE_BYTES / 1024} KB write limit." }
        require(file.parentFile?.canonicalFile?.let { it == root || it.toPath().startsWith(root.toPath()) } == true) {
            "Invalid workspace path."
        }
        file.parentFile?.mkdirs()
        val existed = file.exists()
        val temporary = File(file.parentFile, ".${file.name}.mazkiplay-tmp")
        temporary.writeText(content, Charsets.UTF_8)
        if (!temporary.renameTo(file)) {
            temporary.delete()
            error("Could not safely save file: $path")
        }
        return if (existed) "Updated ${relative(file)}" else "Created ${relative(file)}"
    }

    fun search(query: String): List<String> {
        require(query.isNotBlank()) { "Search query cannot be empty." }
        val needle = query.lowercase()
        return root.walkTopDown().filter { it.isFile && isInsideRoot(it) && it.length() <= MAX_FILE_BYTES }
            .take(MAX_SEARCH_FILES).flatMap { file ->
                runCatching { file.readLines(Charsets.UTF_8).withIndex().filter { it.value.lowercase().contains(needle) }
                    .map { "${relative(file)}:${it.index + 1}: ${it.value.take(240)}" } }.getOrDefault(emptyList()).asSequence()
            }.take(MAX_SEARCH_RESULTS).toList()
    }

    /** Export workspace content to a user-selected document; symlinks and oversized bundles are skipped/rejected. */
    fun exportZip(output: OutputStream): Int {
        val files = root.walkTopDown().filter { it.isFile && isInsideRoot(it) }.take(MAX_EXPORT_FILES + 1).toList()
        require(files.size <= MAX_EXPORT_FILES) { "Workspace has more than $MAX_EXPORT_FILES files; export smaller batches." }
        require(files.sumOf { it.length() } <= MAX_EXPORT_BYTES) { "Workspace export exceeds the 20 MB safety limit." }
        ZipOutputStream(output).use { zip ->
            files.forEach { file ->
                val name = relative(file).replace('\\', '/')
                require(name.isNotBlank() && !name.startsWith("../")) { "Unsafe path in workspace export." }
                zip.putNextEntry(ZipEntry(name))
                file.inputStream().use { it.copyTo(zip) }
                zip.closeEntry()
            }
        }
        return files.size
    }

    private fun resolve(relativePath: String): File {
        val normalized = relativePath.trim().removePrefix("/").ifBlank { "." }
        require(!normalized.split('/').any { it == ".." } && !normalized.contains('\\')) { "Path traversal is not allowed." }
        val candidate = File(root, normalized).canonicalFile
        require(candidate == root || candidate.toPath().startsWith(root.toPath())) { "Path escapes the private workspace." }
        return candidate
    }

    private fun relative(file: File): String = root.toPath().relativize(file.canonicalFile.toPath()).toString().ifBlank { "." }

    private fun isInsideRoot(file: File): Boolean = runCatching {
        file.canonicalFile.toPath().startsWith(root.toPath())
    }.getOrDefault(false)

    private companion object {
        const val MAX_FILE_BYTES = 256 * 1024L
        const val MAX_ENTRIES = 200
        const val MAX_SEARCH_FILES = 500
        const val MAX_SEARCH_RESULTS = 100
        const val MAX_EXPORT_FILES = 500
        const val MAX_EXPORT_BYTES = 20L * 1024 * 1024
    }
}
