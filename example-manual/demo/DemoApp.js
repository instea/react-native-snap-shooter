import React, { Component } from 'react';
import { Text } from 'react-native';
import Menu, {
  MenuContext,
  MenuOptions,
  MenuOption,
  MenuTrigger
} from 'react-native-popup-menu';
import tools from 'react-native-snap-shooter-tools';

export default class ControlledExample extends Component {

  constructor(props, ctx) {
    super(props, ctx);
    this.state = { opened: true };
  }

  render() {
    return (
      <MenuContext
        ref="root"
        style={{flexDirection: 'column', padding: 30}}>
        <Text>Hello world!</Text>
        <Menu
          opened={this.state.opened}
          onBackdropPress={() => this.onBackdropPress()}
          onSelect={value => this.onOptionSelect(value)}>
          <MenuTrigger
            onPress={() => this.onTriggerPress()}
            text='Select option'/>
          <MenuOptions>
            <MenuOption value={1} text='One' />
            <MenuOption value={2}>
              <Text style={{color: 'red'}}>Two</Text>
            </MenuOption>
            <MenuOption value={3} disabled={true} text='Three' />
          </MenuOptions>
        </Menu>
      </MenuContext>
    );
  }

  componentDidMount() {
    setTimeout(() => this.snap(), 1000);
  }

  snap() {
    tools.snapshot(this.refs.root, 'opened').then(() => {
      this.setState({ opened: false });
      setTimeout(() => this.snapClosed(), 1000);
    }).catch(err => console.warn(err));
  }

  snapClosed() {
    tools.snapshot(this.refs.root, 'closed').then(tools.done).catch(err => console.warn(err));
  }
}
