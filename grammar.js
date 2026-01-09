"use strict";
/// <reference types="tree-sitter-cli/dsl" />
module.exports = grammar({
    name: "gosu_template",
    externals: function ($) { return [
        $.content, // Scanner will handle arbitrary text content
    ]; },
    rules: {
        template: function ($) { return repeat(choice($.content, $.directive, $.scriptlet, $.expression, $.interpolation)); },
        // <%@ params(...) %>
        directive: function ($) { return seq('<%@', $._directive_body, '%>'); },
        _directive_body: function ($) { return choice(seq('params', '(', $.parameter_list, ')'), seq('extends', $.type_reference)); },
        // Simple approximations for now, will refine
        parameter_list: function ($) { return /[^\)]+/; },
        type_reference: function ($) { return /[^%]+/; },
        // <% ... %>
        scriptlet: function ($) { return seq('<%', optional($.scriptlet_content), '%>'); },
        scriptlet_content: function ($) { return /[^%]+/; }, // Placeholder, will be injected
        interpolation_content: function ($) { return /[^}]+/; }, // Stop at }
        // <%= ... %>
        expression: function ($) { return seq('<%=', alias($.scriptlet_content, $.expression_content), '%>'); },
        // ${ ... }
        interpolation: function ($) { return seq('${', $.interpolation_content, '}'); }
    }
});
