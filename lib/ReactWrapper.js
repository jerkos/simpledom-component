'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.withGracefulUnmount = withGracefulUnmount;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// this high order component will ensure that the Wrapped Component
// will always be unmounted, even if React does not have the time to
// call componentWillUnmount function
function withGracefulUnmount(WrappedComponent) {

    return function (_Component) {
        _inherits(_class, _Component);

        function _class(props) {
            _classCallCheck(this, _class);

            var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this, props));

            _this.state = { mounted: false };
            console.log('gracefullComponent: ', _this.props.children);
            _this.componentGracefulUnmount = _this.componentGracefulUnmount.bind(_this);
            return _this;
        }

        _createClass(_class, [{
            key: 'componentGracefulUnmount',
            value: function componentGracefulUnmount() {
                this.setState({ mounted: false });

                window.removeEventListener('beforeunload', this.componentGracefulUnmount);
                window.removeEventListener('beforerender', this.componentGracefulUnmount);
            }
        }, {
            key: 'componentWillMount',
            value: function componentWillMount() {
                this.setState({ mounted: true });
            }
        }, {
            key: 'componentDidMount',
            value: function componentDidMount() {
                // make sure the componentWillUnmount of the wrapped instance is executed even if React
                // does not have the time to unmount properly. we achieve that by
                // * hooking on beforeunload for normal page browsing
                window.addEventListener('beforeunload', this.componentGracefulUnmount);
                window.addEventListener('beforerender', this.componentGracefulUnmount);
            }
        }, {
            key: 'componentWillUnmount',
            value: function componentWillUnmount() {
                this.componentGracefulUnmount();
            }
        }, {
            key: 'render',
            value: function render() {
                var mounted = this.state.mounted;

                if (mounted) {
                    return _react2.default.createElement.apply(_react2.default, [WrappedComponent].concat(_toConsumableArray(this.props)));
                }
                return null; // force the unmount
            }
        }]);

        return _class;
    }(_react.Component);
}