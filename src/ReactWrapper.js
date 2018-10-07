import React, {Component} from 'react'

// this high order component will ensure that the Wrapped Component
// will always be unmounted, even if React does not have the time to
// call componentWillUnmount function
export function withGracefulUnmount(WrappedComponent) {

    return class extends Component {

        constructor(props){
            super(props);
            this.state = { mounted: false };
            console.log('gracefullComponent: ', this.props.children);
            this.componentGracefulUnmount = this.componentGracefulUnmount.bind(this)
        }


        componentGracefulUnmount(){
            this.setState({mounted: false});

            window.removeEventListener('beforeunload', this.componentGracefulUnmount);
            window.removeEventListener('beforerender', this.componentGracefulUnmount);
        }

        componentWillMount(){
            this.setState({mounted: true})
        }

        componentDidMount(){
            // make sure the componentWillUnmount of the wrapped instance is executed even if React
            // does not have the time to unmount properly. we achieve that by
            // * hooking on beforeunload for normal page browsing
            window.addEventListener('beforeunload', this.componentGracefulUnmount);
            window.addEventListener('beforerender', this.componentGracefulUnmount);
        }

        componentWillUnmount(){
            this.componentGracefulUnmount()
        }

        render(){

            let { mounted }  = this.state;
            if (mounted) {
                return React.createElement(WrappedComponent, ...this.props);
            }
            return null // force the unmount
        }
    }

}