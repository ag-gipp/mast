'use strict';


const base = require('xtraverse/lib/collection.js');
const xPath = require('xpath');

const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';

const xCmml = xPath.parse('//m:annotation-xml[@encoding="MathML-Content"]');
const xPmml = xPath.parse('//m:annotation-xml[@encoding="MathML-Presentation"]');
const xSemantics = xPath.parse('//m:semantics');

// const log = require('winston/lib/winston.js');

base.prototype.xref = function() {
  return this.attr('xref');
};


base.prototype.select1 = function(path) {
  return base.wrap(
    path.select1({
      node:this[0],
      namespaces:{
        m: MATHML_NS
      }
    }));
};

base.prototype.contentRoot = function() {
  const doc = this.root();
  let content = doc.select1(xCmml);
  if (content.length === 0) {
    const pmmlContent = doc.select1(xPmml);
    if (pmmlContent.length === 0) {
      throw new Error('No content MathML present');
    }
    // use semantic node as root, first child should be the first cmml node
    content = doc.select1(xSemantics);
  }
  return content.children().first();
};

base.prototype.refNode = function() {
  const xref = this.xref();
  if (xref) {
    return base.wrap(this[0].ownerDocument.getElementById(xref));
  } else {
    return base.wrap([]);
  }
};

base.prototype.estimateLocation = function(offset = { line:0,ch:0 }) {
  function getLoc(n) {
    return {
      line: n.lineNumber + offset.line,
      ch: n.columnNumber + offset.ch
    };
  }

  const n = this[0];
  let next = n.nextSibling;
  const start = getLoc(n);
  if (!next) {
    if (n.lastChild) {
      // log.info('estimate end of node based on the last child');
      next = n.lastChild;
    } else {
      // log.warn('cannot estimate end of node');
      next = n;
    }
  }
  const end = getLoc(next);
  return { start,end };
};

base.prototype._addCTreeElements = function(elements, exportNode, exportEdge) {
  function addNodeRecurse(n) {
    exportNode(elements,n);
    n.children().map((c) => {
      const child = base.wrap(c);
      exportEdge(elements,child,child.parent());
      addNodeRecurse(child);
    }
    );
  }
  addNodeRecurse(this.contentRoot());
  return this;
};
// Ensure that id property is set
Object.defineProperty(base.prototype,'id',{
  get() {
    return this.attr('id');
  },
  set(x) {
    return this.attr('id',x);
  } }
);

module.exports = base.wrap;
module.exports.base = base;
