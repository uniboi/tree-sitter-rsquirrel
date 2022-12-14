const comparison = ($, comp) => prec.right(
    seq(
        $.expression,
        comp,
        $.expression
    )
)

module.exports = grammar({
    name: 'rsquirrel',

    rules: {
        source_file: $ => seq(
            // TODO: Order doesn't matter of globals and untyped, change later
            optional($.untyped_statement),
            optional($.globalize_all_functions_statement),
            repeat($.globalize_statement),
            repeat($.file_level_statement),
        ),

        untyped_statement: $ => 'untyped',

        globalize_all_functions_statement: $ => "globalize_all_functions",

        globalize_statement: $ => seq(
            'global',
            $.type,
            $.identifier,
            optional(
                seq(
                    '=',
                    $.literal
                )
            )
        ),

        file_level_statement: $ => choice(
            $.const_declaration,
            $.function_definition,
        ),

        function_level_statement: $ => seq(
            choice(
                $.const_declaration,
                $.variable_declaration,
            ),
            optional(';')
        ),

        type: $ => seq(
            choice(
                $.usual_type,
                $.content_holding_type,
            ),
            optional($.static_array_typedef),
            optional($.ornull_typedef),
        ),

        usual_type: $ => /[A-Z|a-z_][A-Z|a-z\d_]*&?/,

        content_holding_type: $ => prec.left(seq(
            choice(
                seq(
                    'table',
                    optional($.double_content_type)
                ),
                seq(
                    'array',
                    optional($.single_content_type)
                )
            ),
            optional($.ornull_typedef)
        )),

        single_content_type: $ => seq(
            '<',
            $.type,
            '>'
        ),

        double_content_type: $ => seq(
            '<',
            $.type,
            ',',
            $.type,
            '>'
        ),

        static_array_typedef: $ => seq(
            '[',
            $.integer_literal,
            ']'
        ),

        ornull_typedef: $ => 'ornull',

        identifier: $ => /[A-Z|a-z_][A-Z|a-z\d_]*/,

        // TODO: more literals

        function_definition: $ => seq(
            $.type,
            'function',
            $.identifier,
            $.function_parameter_list,
            $.block,
        ),

        function_parameter_list: $ => seq(
            '(',
            optional(
                repeat1(
                    seq(
                        $.function_parameter,
                        ','
                    )
                )
            ),
            optional(
                $.function_parameter
            ),
            ')'
        ),

        function_parameter: $ => seq(
            choice(
                $.function_untyped_parameter,
                $.function_typed_parameter,
            ),
            optional($.default_parameter) // TODO: can you have runtime stuff as default param?
        ),

        function_untyped_parameter: $ => seq(
            $.identifier
        ),

        function_typed_parameter: $ => seq(
            $.type,
            $.identifier
        ),

        default_parameter: $ => seq(
            '=',
            $.literal
        ),

        literal: $ => choice(
            $.integer_literal,
            $.boolean_literal,
            $.null_literal,
            $.float_literal,
            $.string_literal,
            $.vector_literal,
            $.asset_literal,
        ),

        integer_literal: $ => choice(
            $._integer_decimal_literal,
            $._integer_hexadecimal_literal,
            $._char_literal,
        ),

        _integer_decimal_literal: $ => /[\d]+/,

        _integer_hexadecimal_literal: $ => /0x\d+/,

        _char_literal: $ => '[\\]?.',

        boolean_literal: $ => choice(
            'true',
            'false'
        ),

        null_literal: $ => 'null',

        float_literal: $ => /\d+\.\d+/,

        string_literal: $ => choice(
            /\"(\\.|[^"\\])*\"/,
            $.verbatim_string_literal
        ),

        verbatim_string_literal: $ => /@\"(\\.|[^"\\])*\"/i, // TODO: actually do them

        vector_literal: $ => prec.right(
            seq(
                '<',
                $.expression,
                ',',
                $.expression,
                ',',
                $.expression,
                '>'
            )
        ),

        asset_literal: $ => seq(
            /\$\"(\\.|[^"\\])*\"/
        ),

        block: $ => seq(
            '{',
            repeat(
                $.function_level_statement
            ),
            '}'
        ),

        expression: $ => prec.right(
            seq(
                choice(
                    $.literal,
                    seq(
                        $.identifier,
                        repeat(
                            choice(
                                $.literal_string_index_access,
                                $.expression_index_access,
                                $.expression_call,
                            )
                        )
                    ),
                    $.arithmetic_expression,
                    $.bitwise_operations,
                    $.logical_operation,
                    $.ternary_expression,
                ),
                optional(';'),
            )
        ),

        literal_string_index_access: $ => seq(
            '.',
            $.identifier
        ),

        expression_index_access: $ => seq(
            '[',
            $.expression,
            ']'
        ),

        expression_call: $ => seq(
            '(',
            seq(
                repeat(
                    seq(
                        $.expression,
                        ','
                    )
                ),
                optional($.expression)
            ),
            ')'
        ),

        const_declaration: $ => seq(
            'const',
            optional($.type),
            $.identifier,
            '=',
            $.expression,
        ),

        variable_declaration: $ => seq(
            $.type,
            $.identifier,
            optional(
                seq(
                    '=',
                    $.expression
                ),
            )
        ),

        arithmetic_expression: $ => choice(
            comparison($, '+'),
            comparison($, '-'),
            comparison($, '/'),
            comparison($, '*'),
            comparison($, '%'),
        ),

        bitwise_operations: $ => choice(
            comparison($, '>>>'),
            comparison($, '<<<'),
            comparison($, '>>'),
            comparison($, '<<'),
            comparison($, '&'),
            comparison($, '|'),
            comparison($, '^'),
            comparison($, '~'),
        ),

        logical_operation: $ => choice(
            comparison($, '&&'),
            comparison($, '||'),
            comparison($, '=='),
            comparison($, '!='),
            comparison($, '<'),
            comparison($, '>'),
            comparison($, '<='),
            comparison($, '>='),
        ),

        ternary_expression: $ => prec.right(
            seq(
                $.expression,
                '?',
                $.expression,
                ':',
                $.expression,
            )
        ),

        expression_group: $ => repeat(
            $.expression
        ),
    }
});
