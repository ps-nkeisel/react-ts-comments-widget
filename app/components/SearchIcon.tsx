
import * as React from 'react'
import styled from 'styled-components';

interface IProps {
  className?: string;
}

const SearchIcon: React.FC<IProps> = ({ className }) => (
  <div style={{ position: 'absolute' }}>
    <svg viewBox="0 0 615.52 615.52" fill="#454d5d" className={className}>
      <g>
        <g>
          <g id="Search__x28_and_thou_shall_find_x29_">
            <g>
              <path d="M602.531,549.736l-184.31-185.368c26.679-37.72,42.528-83.729,42.528-133.548C460.75,103.35,357.997,0,231.258,0      C104.518,0,1.765,103.35,1.765,230.82c0,127.47,102.753,230.82,229.493,230.82c49.53,0,95.271-15.944,132.78-42.777      l184.31,185.366c7.482,7.521,17.292,11.291,27.102,11.291c9.812,0,19.62-3.77,27.083-11.291      C617.496,589.188,617.496,564.777,602.531,549.736z M355.9,319.763l-15.042,21.273L319.7,356.174      c-26.083,18.658-56.667,28.526-88.442,28.526c-84.365,0-152.995-69.035-152.995-153.88c0-84.846,68.63-153.88,152.995-153.88      s152.996,69.034,152.996,153.88C384.271,262.769,374.462,293.526,355.9,319.763z" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  </div>
)

const StyledSearchIcon = styled(SearchIcon)`
  backface-visibility: visible !important;
  margin: 10px;
  height: 15px;
`;

export default StyledSearchIcon;