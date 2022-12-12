const comparison = ($, op) => seq(
    $._expression,
    op,
    $._expression
)

module.exports = grammar({
    name: 'rsquirrel',

    rules: {
        source_file: $ => seq(
            optional($.untyped_assertion),
            optional($.globalize_all_functions),
            optional(repeat($.globalize_var)),
            repeat($._definition)
        ),

        globalize_all_functions: $ => "globalize_all_functions",
        globalize_var: $ => seq(
            'global',
            $.type,
            $.identifier
        ),
        untyped_assertion: $ => "untyped",

        _definition: $ => choice(
            $.function_definition,
            $.struct_declaration,
            $.const_declaration,
            // TODO: add more definitions
        ),

        statement: $ => seq(
            choice(
                $.return_statement,
                $.const_declaration,
                $.variable_value,
                $.declaration,
                $.thread_statement,
                $.wait_statement,
                $.waitthread_statement,
                $.throw_statement,
                $.break_statement,
                $.continue_statement,
                // TODO: more statements
            ),
            optional(';')
        ),

        // var function var1(var var2){}
        function_definition: $ => seq(
            $.type,
            'function',
            $.identifier,
            $.function_parameter_list,
            $.function_body
        ),

        // (var1, var var2)
        function_parameter_list: $ => seq(
            '(',
            repeat(
                seq(
                    $.function_parameter,
                    ','
                )
            ),
            optional($.function_parameter),
            ')'
        ),

        // var1
        function_untyped_parameter: $ => seq(
            $.identifier
        ),

        // type var1
        function_typed_parameter: $ => seq(
            $.type,
            $.identifier
        ),

        default_parameter: $ => seq(
            '=',
            $.literal
        ),

        // : (var1, var2, var3)
        function_implicit_capture: $ => seq(
            ':',
            '(',
            repeat(
                seq(
                    $.identifier,
                    ','
                )
            ),
            optional($.identifier),
            ')'
        ),

        function_parameter: $ => seq(
            choice(
                $.function_untyped_parameter,
                $.function_typed_parameter,
            ),
            optional($.default_parameter)
        ),

        function_body: $ => seq(
            '{',
            repeat($.statement),
            '}'
        ),

        function_call: $ => seq(
            $.variable_value,
            //'(',
            // optional(
            //     repeat(
            //         seq(
            //             $._expression,
            //             ','
            //         )
            //     )
            // ),
            // optional($._expression),
            //')'
        ),

        thread_statement: $ => seq(
            'thread',
            $._expression
        ),

        wait_statement: $ => seq(
            'wait',
            $._expression
        ),

        waitthread_statement: $ => seq(
            'waitthread',
            $._expression
        ),

        return_statement: $ => prec.left(
            seq(
                'return',
                optional($._expression), // TODO: make this not fuck literals up
                // $._expression
            )
        ),

        throw_statement: $ => seq(
            'throw',
            $._expression
        ),

        break_statement: $ => seq(
            'break'
        ),

        continue_statement: $ => seq(
            'continue'
        ),

        type: $ => seq(
            /[A-Z|a-z_][A-Z|a-z\d_]*&?/i,
            optional($.content_type),
            optional('ornull'),
        ),

        content_type: $ => seq(
            '<',
            $.type,
            optional(
                seq(
                    ',',
                    $.type
                )
            ),
            '>'
        ),

        identifier: $ => /[A-Z|a-z_][A-Z|a-z\d_]*/i,

        variable_access: $ => choice(
            $.literal_string_index_access,
            $.index_access,
            $.callee
        ),

        literal_string_index_access: $ => seq(
            '.',
            $.identifier
        ),

        index_access: $ => seq(
            '[',
            $._expression,
            ']',
        ),

        callee: $ => seq(
            '(',
            optional(
                seq(
                    repeat(
                        seq(
                            $._expression,
                            ','
                        )
                    ),
                    $._expression
                )
            ),
            ')'
        ),

        variable_value: $ => seq(
            $.identifier,
            repeat($.variable_access)
        ),

        _expression: $ => choice(
            //$.content_operation,
            $.literal,
            $.variable_value,
            //$.anonymous_function_declaration,
            //$.function_call,
            //$.table_body,
            //$.array_body,
        ),

        declaration: $ => seq(
            $.type,
            $.identifier,
            optional($.assignment)
        ),

        const_declaration: $ => seq(
            'const',
            /([A-Z|a-z_][A-Z|a-z_\d]*&? )?[A-Z|a-z\d_]+/, // TODO: refactor this using tokens to support const type checking
            '=',
            $.literal
        ),
        // seq(
        //     'const',
        //     optional($.type),
        //     $.identifier,
        //     '=',
        //     $.literal
        // ),
        // choice(
        //     $.const_dynamic_decl,
        //     $.const_static_decl,
        // ),

        const_dynamic_decl: $ => seq(
            'const',
            $.identifier,
            '=',
            $.literal
        ),

        const_static_decl: $ => seq(
            'const',
            $.type,
            $.identifier,
            '=',
            $.literal
        ),

        table_body: $ => seq(
            '{',
            optional(
                repeat(
                    seq(
                        $.identifier,
                        $.assignment
                    )
                )
            ),
            '}'
        ),

        array_body: $ => seq(
            '[',
            repeat(
                seq(
                    $._expression,
                    ','
                )
            ),
            optional($._expression),
            ']'
        ),

        anonymous_function_declaration: $ => seq( // TODO: fix fucking everything up
            optional($.type),
            'function',
            $.function_parameter_list,
            optional($.function_implicit_capture),
            $.function_body
        ),

        // literals
        literal: $ => choice(
            $.number_literal,
            $.string_literal,
            $.null_literal,
            $.boolean_literal,
            $.array_body,
            $.table_body,
            $.vector_literal,
        ),

        boolean_literal: $ => choice(
            'true',
            'false'
        ),

        null_literal: $ => "null",

        number_literal: $ => choice(
            $.number_decimal_literal,
            $.number_hexadecimal_literal,
            $.char_literal,
            $.float_literal,
        ),

        number_decimal_literal: $ => /\d+/,

        number_hexadecimal_literal: $ => /0x\d+/,

        float_literal: $ => /\d+.\d+/,

        char_literal: $ => /'.'/i, // TODO: accept escaped literals

        string_literal: $ => choice(
            /"[^"]*"/i, // TODO: accept escaped quotes
            $.verbatim_string_literal
        ),

        verbatim_string_literal: $ => /@"."/i, // TODO: actually do them

        vector_literal: $ => seq(
            '<',
            $._expression,
            ',',
            $._expression,
            ',',
            $._expression,
            '>'
        ),

        struct_declaration: $ => choice(
            $.instantiable_struct_declaration,
            $.instantiated_struct_declaration
        ),

        instantiable_struct_declaration: $ => seq(
            optional('global'),
            'struct',
            $.identifier,
            '{',
            // TODO: struct declaration body
            '}'
        ),

        instantiated_struct_declaration: $ => seq(
            optional('global'),
            'struct',
            '{',
            // TODO: struct declaration body
            '}',
            $.identifier
        ),

        content_operation: $ => seq(
            $._expression,
            choice(
                // $.bit_shift_operation,
                $.arithmetic_operation,
                // $.logical_operation,
                // '>',
                // '<'
            ),
            $._expression
        ),

        assignment: $ => seq(
            '=',
            $._expression
        ),

        assignment_shortcut: $ => choice(
            $.addition_assignment,
            $.subtraction_assignment,
            // $.increment_assignment_late,
            // $.increment_assignment_early,
            // $.decrement_assignment_late,
            // $.decrement_assignment_early
        ),

        addition_assignment: $ => seq(
            $._expression,
            '+=',
            $._expression
        ),

        subtraction_assignment: $ => seq(
            $._expression,
            '-=',
            $._expression
        ),

        increment_assignment_late: $ => seq(
            $._expression,
            '++'
        ),

        increment_assignment_early: $ => seq(
            '++',
            $._expression,
        ),

        decrement_assignment_late: $ => seq(
            $._expression,
            '--'
        ),

        decrement_assignment_early: $ => seq(
            '--',
            $._expression,
        ),

        logical_operation: $ => choice(
            // $.logical_negation,
            // $.logical_and,
            // $.logical_or,
            // $.logical_equal,
        ),

        logical_negation: $ => seq(
            '!',
            $._expression
        ),

        logical_and: $ => seq(
            $._expression,
            '&&',
            $._expression
        ),

        logical_or: $ => seq(
            $._expression,
            '||',
            $._expression
        ),

        logical_equal: $ => seq(
            $._expression,
            '==',
            $._expression
        ),

        bit_shift_operation: $ => choice(
            // $.bit_right_shift,
            // $.bit_left_shift,
            // $.bit_unsigned_right_shift,
            // $.bit_unsigned_left_shift,
        ),

        bit_right_shift: $ => seq(
            $._expression,
            '>>',
            $._expression
        ),

        bit_left_shift: $ => seq(
            $._expression,
            '<<',
            $._expression
        ),

        bit_unsigned_right_shift: $ => seq(
            $._expression,
            '>>>',
            $._expression
        ),

        bit_unsigned_left_shift: $ => seq(
            $._expression,
            '<<<',
            $._expression
        ),

        arithmetic_operation: $ => choice(
            $.greater_than_operation,
            $.smaller_than_operation,
            // $.plus_operation,
            // $.minus_operation,
            // $.divide_operation,
            // $.multiply_operation
        ),

        greater_than_operation: $ => seq(
            '>',
        ),

        smaller_than_operation: $ => seq(
            '<',
        ),

        plus_operation: $ => seq(
            $._expression,
            '+',
            $._expression
        ),

        minus_operation: $ => seq(
            $._expression,
            '-',
            $._expression
        ),

        divide_operation: $ => seq(
            $._expression,
            '/',
            $._expression
        ),

        multiply_operation: $ => seq(
            $._expression,
            '*',
            $._expression
        ),
    }
});
