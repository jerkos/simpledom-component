'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.updateAttrs = updateAttrs;
exports.convertToNode = convertToNode;

var _util = require('./util');

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _ReactWrapper = require('./ReactWrapper');

var _renderer = require('./renderer');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function updateAttrs(node, element) {
    for (var key in element.attrs) {
        if (element.attrs.hasOwnProperty(key) && element.attrs[key] !== undefined) {
            (function () {
                var value = element.attrs[key];
                if (key === 'ref') {
                    value(node);
                } else if (key.startsWith('on')) {
                    var eventKey = key.substring(2).toLowerCase();
                    node.addEventListener(eventKey, function (event) {
                        return value(event);
                    });
                } else {
                    if (key === 'className') {
                        key = 'class';
                    }
                    key = (0, _util.dasherize)(key);
                    if (key === 'style' && Object.prototype.toString.call(value) == '[object Object]') {
                        for (var styleKey in value) {
                            if (value.hasOwnProperty(styleKey)) {
                                node.style[(0, _util.dasherize)(styleKey)] = value[styleKey];
                            }
                        }
                    } else if (key === 'class' && Object.prototype.toString.call(value) == '[object Object]') {
                        for (var classValue in value) {
                            if (value.hasOwnProperty(classValue) && value[classValue]) {
                                node.classList.add((0, _util.dasherize)(classValue));
                            }
                        }
                    } else {
                        node.setAttribute(key, value);
                    }
                }
            })();
        }
    }
}

function convertToNode(element, store, componentList) {
    if (element === undefined || element === null) {
        return undefined;
    }

    if (element.isComponent) {
        var componentInstance = new element.componentClass(_extends({}, element.props), store);
        componentList.push(componentInstance);
        return convertToNode(componentInstance.renderComponent(element.otherRef), store, componentList);
    }

    if (element.isReactComponent) {
        console.log(element); // for debug purpose
        var reactElem = _react2.default.createElement(element.componentClass, element.attrs, element.children);
        var _node = document.createElement('div');
        _reactDom2.default.render(reactElem, _node);

        var idsToRemove = new Set();
        Array.from(_node.querySelectorAll('div[data-attribute]')).forEach(function (nodeElement) {
            var currentId = +nodeElement.getAttribute('data-attribute');
            idsToRemove.add(currentId);
            var simpleDomChild = _renderer.SIMPLEDOM_CHILDREN.find(function (elem) {
                return elem.id === currentId;
            }).element;
            var componentInstance = new simpleDomChild.componentClass(_extends({}, simpleDomChild.props), store);
            componentList.push(componentInstance);
            var childNode = convertToNode(componentInstance.renderComponent(simpleDomChild.otherRef), store, componentList);
            nodeElement.parentNode.replaceChild(childNode, nodeElement);
        });
        (0, _renderer.setSimpleDomChildren)(_renderer.SIMPLEDOM_CHILDREN.filter(function (sdChild) {
            return !idsToRemove.has(sdChild.id);
        }));
        return _node.firstChild;
    }

    if (!element.isElem) {
        return element.__asHtml ? element : document.createTextNode('' + element);
    }

    var node = document.createElement(element.name);

    updateAttrs(node, element);

    var childLength = element.children.length;

    for (var index = 0; index < childLength; index++) {
        var childElement = element.children[index];
        if (childElement !== undefined && childElement !== null) {
            var childNode = convertToNode(childElement, store, componentList);
            if (childNode !== undefined && childNode !== null) {
                if (childNode.__asHtml) {
                    node.insertAdjacentHTML('beforeend', childNode.__asHtml);
                } else {
                    node.appendChild(childNode);
                }
            }
        }
    }

    return node;
}