import { convertToNode } from './converter';
import { flatten, dasherize, isFunction } from './util';
import { Store } from './Store';
import * as ReactDOM from "react-dom";
import React from "react";

let i = 0;
export let SIMPLEDOM_CHILDREN = [];
export function setSimpleDomChildren(newChildren) {
    SIMPLEDOM_CHILDREN = newChildren;
}

const isReactComp = elem => elem && elem.prototype && elem.prototype.__proto__.isReactComponent;

function buildObject(element) {
    if (element.isReactComponent) {
        return React.createElement(element.componentClass, element.attrs, element.children);
    } else if (element.isComponent) {
        const newElem = React.createElement(
            'div',
            {'data-attribute': i},
            []
        );
        SIMPLEDOM_CHILDREN.push({id: i, element});
        ++i;
        return newElem;
    } else if (typeof element === 'string') {
        // ugly thing to return value
        return element;
    }
    return React.createElement(
        element.name,
        element.attrs,
        (element.children || [])
            .filter(c => c !== null && c !== undefined)
            .map(c => buildObject(c))
    );
}

/**
 * JSX factory function to create an object representing a dom node. Designed to be used with a JSX transpiler.
 * @param {Object|Component|string|function} element the name of the tag, or a {@link Component}.
 * @param {Object} attrs properties of the node, a plain old JS object. Not optional, if no value, put empty object.
 * @param {Array} children the children of the node, a vararg
 * @return {Object} an object representing a dom node.
 */
export function el(element, attrs, ...children) {
    if (element && element.isComponent) {
        const props = {
            ...attrs,
            children: (flatten(children) || []).filter(child => child !== null && child !== undefined)
        };
        return {
            isComponent: true,
            componentClass: element,
            props
        };
    } else if (isReactComp(element)) {
        console.log('children of ' + element.name +': ', children); // debug purpose
        const attributes = {};

        Object.keys(attrs).forEach(keyAttr => {
            const param = attrs[keyAttr];
            if (param.isComponent || param.isElem || isReactComp(param)) {
                attributes[keyAttr] = buildObject(param);
                return;
            }
            attributes[keyAttr] = param;
        });
        return {
            isReactComponent: true,
            componentClass: element,
            attrs: attributes,
            children: (flatten(children) || [])
                .filter(child => child !== null && child !== undefined)
                .map(child => buildObject(child))
                .filter(child => child !== null && child !== undefined),
            //simpleDomChildren
        };
    } else {
        if (isFunction(element)) {
            return element(attrs, ...children);
        }
        return {
            name: element,
            attrs: attrs || {},
            children: (flatten(children) || []).filter(child => child !== null && child !== undefined),
            isElem: true
        };
    }
}

function cleanAnGetNode(node) {
    let realNode = node;
    if (typeof node === 'string') {
        realNode = document.getElementById(node);
    }

    while (realNode.firstChild) {
        realNode.removeChild(realNode.firstChild);
    }
    return realNode;
}

/**
 * Render a component to the dom.
 * @param {string|Node} node the id or the node where the component must be rendered.
 * @param {Component} component the component to render.
 * @param {Store} store the store
 */
export function renderToDom(node, component, store = new Store()) {
    const event = new Event('beforerender');
    window.dispatchEvent(event);
    renderComponents(node, [component], store);
}

function renderComponents(node, components, store = new Store()) {

    const realNode = cleanAnGetNode(node);

    const componentList = [];

    flatten(components).filter(component => component !== undefined && component !== null)
        .map(component => convertToNode(component, store, componentList))
        .forEach(node => realNode.appendChild(node));

    componentList.forEach(component => component.componentDidMount());

    if (componentList.length) {
        const mutationObserver = new MutationObserver(() => {
            if (!document.body.contains(realNode)) {
                mutationObserver.disconnect();
                store.unsubscribeAll();
            }
            for (let index = store.componentsToUnmount.length -1; index >= 0; index--) {
                const component = store.componentsToUnmount[index];
                if (component.node && !realNode.contains(component.node)) {
                    component.componentDidUnmount();
                    store.componentsToUnmount.splice(index, 1);
                }
            }
            for (let index = store.componentsSubscribes.length - 1; index >= 0; index--) {
                const component = store.componentsSubscribes[index];
                if (component.component.node && !realNode.body.contains(component.component.node)) {
                    component.subscribes.forEach(({event, id}) => store.unsubscribeByEventAndId(event, id));
                    component.component.node = undefined;
                    store.componentsSubscribes.splice(index, 1);
                }
            }
        });


        mutationObserver.observe(document.body, {childList: true, subtree: true});
    }
}

/**
 * Render some elements into a string.
 * @param {Array} elements elements returned by {@link el} or primitive like string.
 * @return {string} html as a string.
 */
export function renderToString(...elements) {
    return flatten(elements).map(el => {
        if (!el.name) {
            return '' + (el.__asHtml || el);
        }
        const attributes = Object.keys(el.attrs)
            .filter(attribute => !attribute.startsWith('on') && el.attrs[attribute] !== undefined && attribute !== 'ref')
            .map(attribute => {
                const key = dasherize(attribute === 'className' ? 'class' : attribute);
                let value = el.attrs[attribute];
                if (key === 'style' && typeof value === 'object') {
                    value = Object.keys(value)
                        .map(key => '' + dasherize(key) + ':' + value[key])
                        .join(';');
                } else if (key === 'class' && typeof value === 'object') {
                    value = Object.keys(value).filter(classValue => value[classValue])
                        .map(dasherize)
                        .join(' ');
                }

                return ` ${key}="${value}"`
            })
            .join('');
        const content = renderToString(...el.children);
        return `<${el.name}${attributes}>${content}</${el.name}>`
    }).join('');
}


/**
 * Render some elements into a node.
 * @param {string|Node} node the id or the node where the component must be rendered.
 * @param {Array} elements elements returned by {@link el} or primitive like string.
 */
export function renderTo(node, ...elements) {
    renderComponents(node, elements)
}
