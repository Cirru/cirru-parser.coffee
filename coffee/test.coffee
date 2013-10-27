
# main task

source_file = "./cirru/indent.cr"

q = (query) ->
  document.querySelector query

define (require, exports) ->
  cirru = require "cirru"
  compact = require "compact"
  req = new XMLHttpRequest
  req.open "get", source_file
  req.send()
  req.onload = ->
    cirru.parse.compact = yes
    q("textarea.source").value = req.response
    q("textarea.source").focus()
    paint req.response

  paint = (text) ->
    # console.clear()
    res = cirru.parse text, source_file
    compact.render.hide = yes
    q("textarea.target").value = (compact.render res).trimRight()

  q("textarea.source").onkeyup = ->
    paint @value

  handle = (event) ->
    console.log event.keyCode
    if event.keyCode is 13
      event.preventDefault()
      start = @selectionStart
      text_before = @value[...start]
      text_after = @value[start..]
      last_line = text_before.split("\n").reverse()[0]
      indent = ""
      while last_line[0] is " "
        indent += " "
        last_line = last_line[1..]
      new_text = text_before + "\n" + indent + text_after
      @value = new_text
      @selectionStart = @selectionEnd = start + indent.length + 1
    else if event.keyCode is 9
      event.preventDefault()
      start = @selectionStart
      text_before = @value[...start]
      text_after = @value[start...]
      new_text = text_before + "  " + text_after
      @value = new_text
      @selectionStart = @selectionEnd = start + 2

  q("textarea.source").onkeydown = handle
  q("textarea.target").onkeydown = handle