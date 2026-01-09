/// <reference types="tree-sitter-cli/dsl" />

export = grammar({
    name: "gosu_template",

    externals: $ => [
        $.content, // Scanner will handle arbitrary text content
    ],

    rules: {
        template: $ => repeat(choice(
            $.content,
            $.directive,
            $.scriptlet,
            $.expression,
            $.interpolation
        )),

        // <%@ params(...) %>
        directive: $ => seq(
            '<%@',
            $._directive_body,
            '%>'
        ),

        _directive_body: $ => choice(
            seq('params', '(', $.parameter_list, ')'),
            seq('extends', $.type_reference)
        ),

        // Simple approximations for now, will refine
        parameter_list: $ => /[^\)]+/,
        type_reference: $ => /[^%]+/,

        // <% ... %>
        scriptlet: $ => seq(
            '<%',
            optional($.scriptlet_content),
            '%>'
        ),

        scriptlet_content: $ => /[^%]+/, // Placeholder, will be injected
        interpolation_content: $ => /[^}]+/, // Stop at }

        // <%= ... %>
        expression: $ => seq(
            '<%=',
            alias($.scriptlet_content, $.expression_content),
            '%>'
        ),

        // ${ ... }
        interpolation: $ => seq(
            '${',
            $.interpolation_content,
            '}'
        )
    }
});
