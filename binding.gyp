{
  "targets": [
    {
      "target_name": "tree_sitter_gosu_template_binding",
      "dependencies": [
        "<!(node -p \"require('node-addon-api').targets\"):node_addon_api_except",
      ],
      "include_dirs": [
        "src",
        "node_modules/tree-sitter/vendor/tree-sitter/lib/include",
      ],
      "sources": [
        "bindings/node/binding.cc",
        "src/parser.c",
        "src/scanner.c", 
      ],
      "cflags_c": [
        "-std=c11",
      ],
      "cflags_cc": [
        "-std=c++20", 
      ],
      "conditions": [
        ["OS!='win'", {
          "cflags_c": [
            "-std=c11",
          ],
        }, { # OS == "win"
          "cflags_c": [
            "/std:c11",
            "/utf-8",
          ],
        }],
      ],
    }
  ]
}
