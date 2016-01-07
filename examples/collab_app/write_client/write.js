import Ractive from "ractive";
import {
  forEach,
  map,
  uniqueId
} from "lodash";

const changeCbs = [];

let doc, pauseObservers;

export function init(el, initLines, myid) {
  doc = new Ractive({
    el: el,
    template: "<textarea value={{text}}></textarea>",
    data: {
      text: map(initLines, line => line.join(" ")).join("\n")
    }
  });
  doc.observe("text", text => {
    if (pauseObservers) { return; }
    forEach(changeCbs, cb => cb(text));
  });
};

export function setText(text, report = true) {
  pauseObservers = !report;
  doc.set("text", text);
  pauseObservers = false;
}

export function setLineText(line, lineText, report = true) {
  pauseObservers = !report;
  let text = doc.get("text").split("\n");
  text[line] = lineText;
  doc.set("text", text.join("\n"));
  pauseObservers = false;
}

export function setWordText(line, word, wordText, report = true) {
  pauseObservers = !report;
  let text = map(doc.get("text").split("\n"), line => line.split(" "));
  text[line][word] = wordText;
  doc.set("text", map(text, line => line.join(" ")).join("\n"));
  pauseObservers = false;
}

export function onTextChange(cb) {
  changeCbs.push(cb);
}
