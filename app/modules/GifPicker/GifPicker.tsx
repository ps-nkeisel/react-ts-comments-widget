import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import React from 'react';
import styled from 'styled-components';

import Input from '@vuukle/input';
import Loader from '@vuukle/loader';
import { translation } from 'services/translation';

import GifItem from './GifItem';
import { getSearchGIFs, getTrendingGIFs, IGIFItem } from './utils';

interface IProps {
  onSelect: (GIFLink: string) => void;
}

const SearchResult = styled.div`
  margin-top: 5px;
  margin-right: -5px;
  height: 250px;
  overflow-y: auto;
  > p {
    font-size: 0.8em;
    color: ${(props) => props.theme.mutedColor};
    text-transform: uppercase;
    font-weight: bold;
    margin: 0 0 10px;
  }
  > div {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }
`;

const GifPicker: React.FC<IProps> = ( props ) => {
  const [GIFs, setGIFs] = React.useState<IGIFItem[]>([]);
  const [searchGIFs, setSearchGIFs] = React.useState<IGIFItem[]>([]);
  const [searchValue, setSearchValue] = React.useState<string>('');
  const [limit, setLimit] = React.useState<number>(10);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    getTrending();
  }, [] );

  React.useEffect(() => {
    doSearchGIFs();
  }, [searchValue] );

  /**
   * Search input change handler
   * @param {React.FormEvent<HTMLInputElement>} e - Input event
   * @return {void}
   */
  const onSearchInputChange = (e: React.FormEvent<HTMLInputElement>) => {
    setSearchValue(e.currentTarget.value || '');
    setLimit(10);
    setLoading(true);
  }

  /**
   * Get trending GIFs and update state
   * @return {Promise<void>}
   */
  const getTrending = async (): Promise<void> => {
    const trendingResponse = await getTrendingGIFs(limit);
    setGIFs(trendingResponse.data);
    setLimit(limit + 10);
    setLoading(false);
  };

  /**
   * Get GIFs based on search input value. If it's empty then get trending GIFs.
   * @return {Promise<void>}
   */
  const doSearchGIFs = debounce(async (): Promise<void> => {
    if (searchValue) {
      const searchResponse = await getSearchGIFs(searchValue, limit);
      setSearchGIFs(searchResponse.data);
      setLimit(limit + 10);
      setLoading(false);
    } else {
      getTrending().then(() => setSearchGIFs([]));
    }
  }, 1000);

  /** Renders GIF items from the Giphy response */
  // tslint:disable-next-line: no-shadowed-variable
  const renderGifItems = (gifItems: IGIFItem[]): JSX.Element[] =>
    gifItems.map((gif: IGIFItem) => (
      <GifItem
        key={gif.id}
        image={gif.images.fixed_height_small.url}
        onClick={() => props.onSelect(gif.images.downsized_medium.url)}
      />
    ));

  // Load more GIFs when user scrolls down to the bottom
  const handleScroll = throttle((e: any) => {
    e.persist();
    const scrollElement = e.target;
    // if user has scrolled to the bottom of the dropdown
    if (scrollElement && scrollElement.scrollHeight - scrollElement.scrollTop === scrollElement.clientHeight) {
      setLoading(true);
      doSearchGIFs();
    }
  }, 800);

  /** Select GIFs array to render based on search input */
  const gifItems = searchGIFs.length > 0 ? searchGIFs : GIFs;
  return (
    <div>
      <div>
        <Input
          placeholder={translation.editorOptions.gifSearch}
          value={searchValue}
          onChange={onSearchInputChange}
        />
      </div>
      <SearchResult onScroll={e => handleScroll(e)} onPointerMove={e => handleScroll(e)}>
        <p>
          {searchGIFs.length
            ? translation.editorOptions.gifSearchResults
            : translation.editorOptions.gifTrending}
        </p>
        <div>{renderGifItems(gifItems)}</div>
        {loading && <Loader style={{ margin: '20px auto' }} size="20px" />}
      </SearchResult>
    </div>
  );
}

export default GifPicker;
