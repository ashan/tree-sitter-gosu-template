#include <tree_sitter/parser.h>
#include <wctype.h>

enum TokenType {
  CONTENT,
};

void *tree_sitter_gosu_template_external_scanner_create() { return NULL; }

void tree_sitter_gosu_template_external_scanner_destroy(void *payload) {}

unsigned tree_sitter_gosu_template_external_scanner_serialize(void *payload,
                                                              char *buffer) {
  return 0;
}

void tree_sitter_gosu_template_external_scanner_deserialize(void *payload,
                                                            const char *buffer,
                                                            unsigned length) {}

bool tree_sitter_gosu_template_external_scanner_scan(
    void *payload, TSLexer *lexer, const bool *valid_symbols) {
  if (valid_symbols[CONTENT]) {
    bool has_content = false;

    while (lexer->lookahead != 0) {
      if (lexer->lookahead == '<') {
        lexer->mark_end(lexer);
        lexer->advance(lexer, false);
        if (lexer->lookahead == '%') {
          // Found start of tag <%
          if (has_content) {
            lexer->result_symbol = CONTENT;
            return true; // Return the content we found so far
          } else {
            return false; // Let the grammar match the tag
          }
        }
        // Just a <, continue
        has_content = true;
      } else if (lexer->lookahead == '$') {
        lexer->mark_end(lexer);
        lexer->advance(lexer, false);
        if (lexer->lookahead == '{') {
          // Found start of interpolation ${
          if (has_content) {
            lexer->result_symbol = CONTENT;
            return true;
          } else {
            return false;
          }
        }
        has_content = true;
      } else {
        lexer->advance(lexer, false);
        has_content = true;
      }
      lexer->mark_end(lexer);
    }

    // EOF
    if (has_content) {
      lexer->result_symbol = CONTENT;
      return true;
    }
  }

  return false;
}
