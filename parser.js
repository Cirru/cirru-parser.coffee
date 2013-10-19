// Generated by CoffeeScript 1.6.3
(function() {
  var Charactar, Inline, error, parse, parseBlock, parseNested, parseText, parseTree, tokenize, wrap_text;

  Charactar = (function() {
    function Charactar(opts) {
      this.text = opts.char;
      this.x = opts.x;
      this.y = opts.y;
      this.file = opts.file;
    }

    Charactar.prototype.isBlank = function() {
      return this.text === " ";
    };

    Charactar.prototype.isOpenParen = function() {
      return this.text === "(";
    };

    Charactar.prototype.isCloseParen = function() {
      return this.text === ")";
    };

    Charactar.prototype.isDollar = function() {
      return this.text === "$";
    };

    Charactar.prototype.isDoubleQuote = function() {
      return this.text === '"';
    };

    Charactar.prototype.isBackslash = function() {
      return this.text === "\\";
    };

    return Charactar;

  })();

  Inline = (function() {
    function Inline(opts) {
      var file, y;
      file = opts.file;
      y = opts.y;
      this.line = opts.line.split("").map(function(char, x) {
        return new Charactar({
          char: char,
          x: x,
          y: y,
          file: file
        });
      });
    }

    Inline.prototype.isEmpty = function() {
      if (this.line.length === 0) {
        return true;
      } else {
        return this.line.every(function(char) {
          return char.isBlank();
        });
      }
    };

    Inline.prototype.getIndent = function() {
      var char, n, _i, _len, _ref;
      n = 0;
      _ref = this.line;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        char = _ref[_i];
        if (char.isBlank()) {
          n += 1;
        } else {
          break;
        }
      }
      return Math.ceil(n / 2);
    };

    Inline.prototype.dedent = function() {
      var first;
      this.line.shift();
      first = this.line[0];
      if (first.isBlank()) {
        return this.line.shift();
      }
    };

    Inline.prototype.shift = function() {
      return this.line.shift();
    };

    Inline.prototype.line_end = function() {
      return this.line.length === 0;
    };

    return Inline;

  })();

  wrap_text = function(text, filename) {
    var file;
    file = {
      text: text,
      filename: filename
    };
    return text.split("\n").map(function(line, y) {
      return new Inline({
        line: line,
        y: y,
        file: file
      });
    });
  };

  parseNested = function(curr_lines) {
    curr_lines.map(function(line) {
      return line.dedent();
    });
    return parseBlock(curr_lines);
  };

  parseBlock = function(curr_lines) {
    var buffer, collection, digest_buffer;
    collection = [];
    buffer = [];
    digest_buffer = function() {
      var line;
      if (buffer.length > 0) {
        line = buffer[0];
        if ((collection.length === 0) && (line.getIndent() > 0)) {
          collection.push(parseNested(buffer));
        } else {
          collection.push(parseTree(buffer));
        }
        return buffer = [];
      }
    };
    curr_lines.map(function(line) {
      if (line.isEmpty()) {
        return;
      }
      if (line.getIndent() === 0) {
        digest_buffer();
      }
      return buffer.push(line);
    });
    digest_buffer();
    return collection;
  };

  parseTree = function(tree) {
    var args, follows, func;
    follows = tree.slice(1).map(function(line) {
      line.dedent();
      return line;
    });
    args = void 0;
    if (follows.length > 0) {
      args = parseBlock(follows);
    }
    func = parseText(tree[0], args);
    return func;
  };

  tokenize = function(line) {
    var add_buffer, buffer, char, digest_buffer, escape_mode, quote_mode, tokens;
    tokens = [];
    buffer = void 0;
    quote_mode = false;
    escape_mode = false;
    digest_buffer = function(as_string) {
      var type;
      type = as_string != null ? "string" : "text";
      if (buffer != null) {
        tokens.push({
          type: type,
          buffer: buffer
        });
        return buffer = void 0;
      }
    };
    add_buffer = function(the_char) {
      if (buffer != null) {
        return buffer.text += the_char.text;
      } else {
        return buffer = char;
      }
    };
    while (!line.isEmpty()) {
      char = line.shift();
      if (quote_mode) {
        if (escape_mode) {
          add_buffer(char);
          escape_mode = false;
        } else {
          if (char.isDoubleQuote()) {
            digest_buffer("string");
            quote_mode = false;
          } else if (char.isBackslash()) {
            escape_mode = true;
          } else {
            add_buffer(char);
          }
        }
      } else {
        if (char.isBlank()) {
          digest_buffer();
        } else if (char.isOpenParen()) {
          digest_buffer();
          tokens.push({
            type: "openParen"
          });
        } else if (char.isCloseParen()) {
          digest_buffer();
          tokens.push({
            type: "closeParen"
          });
        } else if (char.isDoubleQuote()) {
          digest_buffer();
          quote_mode = true;
        } else {
          add_buffer(char);
        }
      }
    }
    digest_buffer();
    return tokens;
  };

  parseText = function(line, args) {
    var collection, cursor, dollar_pointer, history, paren_record, pointer, step_data, step_in, step_out, tokens, use_dollar;
    tokens = tokenize(line);
    paren_record = 0;
    use_dollar = false;
    collection = [];
    pointer = collection;
    history = [];
    dollar_pointer = void 0;
    step_in = function() {
      var new_pointer;
      new_pointer = [];
      pointer.push(new_pointer);
      history.push(pointer);
      return pointer = new_pointer;
    };
    step_out = function() {
      return pointer = history.pop();
    };
    step_data = function(a_cursor) {
      return pointer.push(a_cursor.buffer);
    };
    while (tokens.length > 0) {
      cursor = tokens.shift();
      if (cursor.type === "string") {
        step_data(cursor);
      } else if (cursor.type === "text") {
        if (cursor.buffer.text === "$") {
          dollar_pointer = step_in();
          use_dollar = true;
        } else {
          step_data(cursor);
        }
      } else if (cursor.type === "openParen") {
        step_in();
        paren_record += 1;
      } else if (cursor.type === "closeParen") {
        step_out();
        paren_record -= 1;
        if (use_dollar) {
          step_out();
          use_dollar = false;
        }
      }
    }
    if (use_dollar) {
      dollar_pointer.push.apply(dollar_pointer, args);
    } else {
      collection.push.apply(collection, args);
    }
    return collection;
  };

  parse = function(text, filename) {
    var whole_list;
    whole_list = wrap_text(text, filename);
    return parseBlock(whole_list);
  };

  error = function(char) {
    var error_line, hint_line, lines, _i, _ref, _results;
    lines = char.file.text.split("\n");
    error_line = lines[char.y];
    hint_line = (function() {
      _results = [];
      for (var _i = 1, _ref = char.x; 1 <= _ref ? _i <= _ref : _i >= _ref; 1 <= _ref ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this).map(function() {
      return " ";
    }).join("") + "^";
    return error_line + "\n" + hint_line;
  };

  if (typeof define !== "undefined" && define !== null) {
    define({
      parse: parse,
      error: error
    });
  } else if (typeof exports !== "undefined" && exports !== null) {
    exports.parse = parse;
    exports.error = error;
  } else if (typeof window !== "undefined" && window !== null) {
    window.cirru = {
      parse: parse,
      error: error
    };
  }

}).call(this);

/*
//@ sourceMappingURL=parser.map
*/
