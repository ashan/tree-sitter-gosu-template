; Scriptlets <% ... %>
(scriptlet_content) @injection.content
(#set! injection.language "gosu")

; Expressions <%= ... %>
(expression_content) @injection.content
(#set! injection.language "gosu")
(#set! injection.include-children)

; Interpolation ${ ... }
(interpolation_content) @injection.content
(#set! injection.language "gosu")

; Parameters inside <%@ params(...) %>
; We might want to inject only the parameters part as "gosu"
; or specifically as function parameters if possible.
(parameter_list) @injection.content
(#set! injection.language "gosu")

(type_reference) @injection.content
(#set! injection.language "gosu")
