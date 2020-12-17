import React from 'react';
import MentionListItem from './MentionItem';

interface IMentionItem {
  name: string;
  avatarUrl: string;
  id: string;
}

interface IProps {
  items: IMentionItem[];
  onSelect: (itemIndex: number) => void;
}

interface IState {
  selectedIndex: number;
  suspendMouseEnter: boolean;
}

class MentionList extends React.PureComponent<IProps, IState> {
  private ref: React.RefObject<HTMLUListElement> = React.createRef();
  public readonly state: IState = {
    selectedIndex: 0,
    suspendMouseEnter: false,
  };

  /** Handles mouse move over this container */
  private handleMouseMove = () => this.setState({ suspendMouseEnter: false });

  /** Handles Item selection */
  private handleItemSelect = () => this.props.onSelect(this.state.selectedIndex);

  /** Handles a few key presses to navigate in list or to select element */
  private handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        this.setState(
          (state, props) => ({
            selectedIndex: (state.selectedIndex + props.items.length - 1) % props.items.length,
            suspendMouseEnter: true,
          }),
          this.scrollToIfNeeded
        );
        break;
      case 'ArrowDown':
        this.setState(
          (prevState, props) => ({
            selectedIndex: (prevState.selectedIndex + 1) % props.items.length,
            suspendMouseEnter: true,
          }),
          this.scrollToIfNeeded
        );
        break;
      case 'Enter':
      case 'Tab':
        return this.handleItemSelect();
    }
  };

  private onItemMouseEnter = (id: string) => {
    if (this.state.suspendMouseEnter) {
      return;
    }

    const selectedIndex = this.props.items.findIndex((item) => item.id === id);
    if (selectedIndex >= 0) {
      this.setState({ selectedIndex });
    }
  };

  private scrollToIfNeeded = () => {
    if (!this.ref.current) {
      return;
    }

    const { selectedIndex } = this.state;
    const listElement = this.ref.current;

    if (!listElement.childNodes[selectedIndex]) {
      return;
    }

    // @ts-ignore
    const itemHeight = listElement.childNodes[selectedIndex].offsetHeight;
    const itemPos = selectedIndex * itemHeight;
    const containerTop = listElement.scrollTop;
    const containerBottom = containerTop + listElement.offsetHeight;

    if (itemPos < containerTop) {
      // Scroll up if the item is above the top of the container
      listElement.scrollTop = itemPos;
    } else if (itemPos > containerBottom - itemHeight) {
      // scroll down if any part of the element is below the bottom of the container
      listElement.scrollTop += itemPos - containerBottom + itemHeight;
    }
  };

  public componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  public componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  public render() {
    const { items } = this.props;
    const selectedId = (items.length > 0 && items[this.state.selectedIndex].id) || undefined;

    return (
      <ul className="ql-mention-list" ref={this.ref} onMouseMove={this.handleMouseMove}>
        {items.map(({ name, id, avatarUrl }) => (
          <MentionListItem
            name={name}
            avatarUrl={avatarUrl}
            id={id}
            key={id}
            isActive={selectedId === id}
            onMouseEnter={this.onItemMouseEnter}
            onSelect={this.handleItemSelect}
          />
        ))}
      </ul>
    );
  }
}

export default MentionList;
