import { createErrorType } from '../util';

import { identifier, number, sum, subtraction,
         product, fraction, functionCall, assignment,
         isIdentifier } from './expression';

const ParseError = createErrorType('ParseError');

const isDigit = (c) => c >= '0' && c <= '9';
const isLetter = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');

const HIGHEST_PREDECENCE = 1;

const TokenTypes = {
    NUMBER: 0,
    IDENTIFIER: 1,
    ADD_OPERATOR: 2,
    SUB_OPERATOR: 3,
    MUL_OPERATOR: 4,
    DIV_OPERATOR: 5,
    OPEN_PAREN: 6,
    CLOSED_PAREN: 7,
    EQUAL: 8,
    EOF: 9,
};

class Parser {
    currentChar() {
        return this.input[this.pos];
    }

    advance() {
        this.pos++;

        if (this.pos === this.input.length) {
            // The parser is out of input but it still has to emit the EOF token to be finished
            this.exhausted = true;
        }
    }

    readWhile(condition) {
        const start = this.pos;

        while (!this.exhausted && condition(this.currentChar())) {
            this.advance();
        }

        return this.input.substr(start, this.pos - start);
    }

    parseNumber() {
        // TODO: Do the actual parsing myself
        const integerPart = this.readWhile(isDigit);
        const integerValue = integerPart.length > 0 ? parseInt(integerPart, 10) : 0;

        if (this.exhausted || this.currentChar() !== '.') {
            return {
                text: integerPart,
                number: integerValue
            };
        }

        this.advance();

        const realPart = this.readWhile(isDigit);
        const realValue = realPart.length > 0 ? parseFloat(integerPart + '.' + realPart) : integerValue;

        return {
            text: integerPart + '.' + realPart,
            number: realValue
        };
    }

    nextToken() {
        // Skip whitespace
        while (this.currentChar() === ' ' && !this.exhausted) {
            this.advance();
        }

        if (this.exhausted) {
            this.finished = true;
            return {
                type: TokenTypes.EOF
            };
        }

        if (isDigit(this.currentChar())) {
            const { text, number } = this.parseNumber();
            return {
                number,

                type: TokenTypes.NUMBER,
                value: text,
            };
        }

        if (isLetter(this.currentChar())) {
            return {
                type: TokenTypes.IDENTIFIER,
                value: this.readWhile(isLetter)
            };
        }

        const oneCharacterTokens = {
            '(': TokenTypes.OPEN_PAREN,
            ')': TokenTypes.CLOSED_PAREN,
            ',': TokenTypes.COMMA,
            '+': TokenTypes.ADD_OPERATOR,
            '-': TokenTypes.SUB_OPERATOR,
            '*': TokenTypes.MUL_OPERATOR,
            '/': TokenTypes.DIV_OPERATOR,
            '=': TokenTypes.EQUAL,
        };

        if (this.currentChar() in oneCharacterTokens) {
            const c = this.currentChar();
            this.advance();
            return {
                type: oneCharacterTokens[c],
                value: c
            };
        }

        // TODO: Implement ParserException
        throw new ParseError('Unexpected char \'' + this.currentChar() + '\'');
    }

    testToken(type) {
        if (this.peekedToken.type === type) {
            this.currentToken = this.peekedToken;
            this.peekedToken = this.nextToken();

            return true;
        }

        return false;
    }

    expectToken(type, errorMessage) {
        if (!this.testToken(type)) {
            throw new ParseError(errorMessage + ' at ' + this.input.slice(Math.max(0, this.pos - 2), this.pos + 2));
        }
    }

    parseAtom() {
        if (this.testToken(TokenTypes.IDENTIFIER)) {
            return identifier(this.currentToken.value);
        } else if (this.testToken(TokenTypes.NUMBER)) {
            return number(this.currentToken.number);
        } else if (this.testToken(TokenTypes.OPEN_PAREN)) {
            const atom = this.parseExpression();
            this.expectToken(TokenTypes.CLOSED_PAREN, 'Expected \')\'');
            return atom;
        }

        throw new ParseError('Unexpected token \'' + this.currentToken.value + '\'');
    }

    parseFunction() {
        const atom = this.parseAtom();

        if (isIdentifier(atom) && this.testToken(TokenTypes.OPEN_PAREN)) {

            if (this.testToken(TokenTypes.CLOSED_PAREN)) {
                return functionCall(atom.name, []);
            } else {
                let args = [this.parseExpression()];

                while (this.testToken(TokenTypes.COMMA)) {
                    args.push(this.parseExpression());
                }

               this.expectToken(TokenTypes.CLOSED_PAREN, 'Expected \')\'');

               return functionCall(atom.name, args);
            }
        }

        return atom;
    }

    parseUnaryOperator() {
        if (this.testToken(TokenTypes.SUB_OPERATOR)) {
            return product([number(-1), this.parseUnaryOperator()]);
        }

        return this.parseFunction();
    }

    parseBinaryOperator(pred) {
        const left = (pred === 0) ? this.parseUnaryOperator() : this.parseBinaryOperator(pred - 1);

        if (pred === 1) {
            if (this.testToken(TokenTypes.ADD_OPERATOR)) {
                return sum([left, this.parseBinaryOperator(pred)]);
            }

            if (this.testToken(TokenTypes.SUB_OPERATOR)) {
                return subtraction(left, this.parseBinaryOperator(pred));
            }
        }

        if (pred === 0) {
            if (this.testToken(TokenTypes.MUL_OPERATOR)) {
                return product([left, this.parseBinaryOperator(pred)]);
            }

            if (this.testToken(TokenTypes.DIV_OPERATOR)) {
                return fraction(left, this.parseBinaryOperator(pred));
            }
        }

        return left;
    }


    parseExpression() {
        return this.parseBinaryOperator(HIGHEST_PREDECENCE);
    }

    parseAssignment() {
        const left = this.parseExpression();

        if (this.testToken(TokenTypes.EQUAL)) {
            const right = this.parseExpression();

            return assignment(left, right);
        }

        return left;
    }

    parse(input) {
        if (input.length === 0) {
            throw new ParseError('Expected input');
        }

        this.input = input;
        this.exhausted = false;
        this.finished = false;
        this.pos = 0;

        this.peekedToken = this.nextToken();

        const expr = this.parseAssignment();
        this.expectToken(TokenTypes.EOF, 'Expected EOF');

        return expr;
    }
}

const defaultParser = new Parser();
function parse(input) {
    return defaultParser.parse(input);
}

export { Parser, defaultParser, parse, ParseError };