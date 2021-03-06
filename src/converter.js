
import {dasherize} from './util';
import React from "react";
import ReactDOM from 'react-dom';
import {withGracefulUnmount} from "./ReactWrapper";
import {setSimpleDomChildren, SIMPLEDOM_CHILDREN} from "./renderer";


export function updateAttrs(node, element) {
    for (let key in element.attrs) {
        if (element.attrs.hasOwnProperty(key) && element.attrs[key] !== undefined) {
            let value = element.attrs[key];
            if (key === 'ref') {
                value(node);
            } else if (key.startsWith('on')) {
                const eventKey = key.substring(2).toLowerCase();
                node.addEventListener(eventKey, event => value(event));
            } else {
                if (key === 'className') {
                    key = 'class';
                }
                key = dasherize(key);
                if (key === 'style' && Object.prototype.toString.call(value) == '[object Object]') {
                    for (const styleKey in value) {
                        if (value.hasOwnProperty(styleKey)) {
                            node.style[dasherize(styleKey)] = value[styleKey]
                        }
                    }
                } else if (key === 'class' && Object.prototype.toString.call(value) == '[object Object]') {
                    for (const classValue in value) {
                        if (value.hasOwnProperty(classValue) && value[classValue]) {
                            node.classList.add(dasherize(classValue));
                        }
                    }
                } else {
                    node.setAttribute(key, value);
                }
            }
        }
    }
}

export function convertToNode(element, store, componentList) {
    if (element === undefined || element === null) {
        return undefined;
    }

    if (element.isComponent) {
        let componentInstance = new element.componentClass({...element.props}, store);
        componentList.push(componentInstance);
        return convertToNode(componentInstance.renderComponent(element.otherRef), store, componentList);
    }

    if (element.isReactComponent) {
        console.log(element); // for debug purpose
        const reactElem = React.createElement(element.componentClass, element.attrs, element.children);
        const node = document.createElement('div');
        ReactDOM.render(reactElem, node);

        const idsToRemove = new Set();
        Array.from(node.querySelectorAll('div[data-attribute]'))
            .forEach(nodeElement => {
                const currentId = +nodeElement.getAttribute('data-attribute');
                idsToRemove.add(currentId);
                const simpleDomChild = SIMPLEDOM_CHILDREN.find(elem => elem.id === currentId).element;
                let componentInstance = new simpleDomChild.componentClass({...simpleDomChild.props}, store);
                componentList.push(componentInstance);
                const childNode = convertToNode(
                    componentInstance.renderComponent(simpleDomChild.otherRef),
                    store,
                    componentList
                );
                nodeElement.parentNode.replaceChild(childNode, nodeElement);
            }
        );
        setSimpleDomChildren(SIMPLEDOM_CHILDREN.filter(sdChild => !idsToRemove.has(sdChild.id)));
        return node.firstChild;
    }

    if (!element.isElem) {
        return element.__asHtml ? element : document.createTextNode('' + element);
    }

    const node = document.createElement(element.name);

    updateAttrs(node, element);

    const childLength = element.children.length;

    for (let index = 0; index < childLength; index++) {
        const childElement = element.children[index];
        if (childElement !== undefined && childElement !== null) {
            const childNode = convertToNode(childElement, store, componentList);
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

