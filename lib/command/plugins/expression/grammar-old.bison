/* lexical grammar */
%lex
%%

\s+                         /* skip whitespace */
[0-9]+("."[0-9]+)?\b       return 'NUMBER';
"false"                    return 'NO'
"true"                     return 'YES'
/\{\{[^\}\}]+\}\}          return 'MUSTACH'
">="                       return '>=';
"<="                       return '<=';
"=="                       return '==';
"!="                       return '!=';
"&&"                       return '&&';
"||"                       return '||';
"+"                        return '+';
"-"                        return '-';
"*"                        return '*';
"/"                        return '/';
"%"                        return '%';
">"                        return '>';
"<"                        return '<';
"("                        return '(';
")"                        return ')';
","                        return ',';
\$(\.[a-zA-Z]+){2}         return 'FILTER'
('"'("\\"["]|[^"])*'"')	   return 'STRING'
(\'[^\']*\')                return 'STRING'
<<EOF>>                    return 'EOF'
.                          return 'INVALID'

/lex
%{
    function log() {
      //  console.log.apply(console, arguments)
    }
    function isObject(o) {
        return o instanceof Object
    }
    function isString(v) {
        return v && (typeof v === "string");
    }
    function trim(str) {
        return isString(str) && str.replace(/^\s+|\s+$/g, '')
    }
    function makeop(left, op, right) {
        if (op == 'JOIN') {
            op = '+'
            if (!isObject(left)) left += ''
            if (!isObject(right)) right += ''
        }
        var result = {
            op,
            left,
            right,
        }
        //  log(result)
        return result;
    }

    function mustach(value) {
        return '{{' + trim(value.substr(2, value.length - 4)) + '}}'
    }
%}


/* operator associations and precedence */


%left '&&' '||'
%left ','
%left '<' '>' '==' '>=' '<=' '!='
%left '+' '-'
%left '*' '/' '%'
%left '^'
%left UMINUS
%left '!'

%start expressions

%% /* language grammar */

expressions
    : e EOF {return $1;}
    ;

invalid_arg
    : INVALID {$$ = $1; log('INVAID:',$1)}
    | INVALID INVALID {$$ = $1 + $2; log('INVAID INVAID',$1, $2)}
    | invalid_arg  INVALID {$$ = $1 + $2; log('arg INVALID:',$1)}
    ;

join_arg
    : invalid_arg               {$$ = "'" + $1 + "'"; log('INVAID2:',$1)}
    | YES                       {$$ = true; log('YES:', $1);}
    | NO                        {$$ = false; log('NO:', $1);}
    | NUMBER                    {$$ = parseFloat($1); log('NUMBER:',$1)}
    | STRING                    {log('string:',$1)}
    | MUSTACH                   {log('mustach:',$1); $$ = mustach($1) }
    | FILTER '(' ')'            {log('filter()');    $$ = makeop([], $1, null)}
    | FILTER  '(' va_list ')'   {log('filter(...)'); $$ = makeop($va_list, $1 + ':' + (Array.isArray($va_list) ? $va_list.length : 1), null);}
    ;    

join
    : join_arg                  {log('join -arg:', $1)}
    | join join                 {$$ = makeop($1, 'JOIN', $2); log('join join', $1, $2)}
    ;

op
    : '+'
    | '-'
    | '*'
    | '/'
    | '%'
    | '>='
    | '<='
    | '>'
    | '<'
        | '&&'
    | '=='
    | '!='

    | '||'
    ;
e
    :join     
    | e '+' e                 {$$ = makeop($1, $2, $3)}
	| e '-' e                 {$$ = makeop($1, $2, $3)}
    | e '*' e                 {$$ = makeop($1, $2, $3)}
    | e '/' e                 {$$ = makeop($1, $2, $3)}
    | e '%' e                 {$$ = makeop($1, $2, $3)}
    | e '>=' e                {$$ = makeop($1, $2, $3)}
    | e '<=' e                {$$ = makeop($1, $2, $3)}
    | e '>' e                 {$$ = makeop($1, $2, $3)}
    | e '<' e                 {$$ = makeop($1, $2, $3)}
    | e '==' e                {$$ = makeop($1, $2, $3)}
    | e '!=' e                {$$ = makeop($1, $2, $3)}
    | e '&&' e                {$$ = makeop($1, $2, $3)}
    | e '||' e                {$$ = makeop($1, $2, $3)} 
    | '(' e ')'               {$$ =$e ;}
	;

va_list
    : e                       {$$ = [$e]; log('va_list init', $1)}
    | va_list ',' e           { log('va_list add', $e);$$ = $va_list; $$.push($e); }
//	| e ',' va_list           { log('va_list add', $e);$$ = $va_list; $$.push($e); }
	;