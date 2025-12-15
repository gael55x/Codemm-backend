"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDefaultClassSkeleton = buildDefaultClassSkeleton;
exports.inferClassName = inferClassName;
/**
 * Generate a minimal class skeleton for Java.
 * Extracted from legacy ProblemAgent for reuse in v1.0 generation.
 */
function buildDefaultClassSkeleton(className) {
    return `public class ${className} {\n\n    // TODO: implement solution\n\n}\n`;
}
/**
 * Infer the Java class name from source code.
 */
function inferClassName(source, fallback = "Solution") {
    const match = source.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)/);
    return match && match[1] ? match[1] : fallback;
}
//# sourceMappingURL=javaCodegen.js.map