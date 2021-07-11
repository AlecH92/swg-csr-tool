import React, { useState } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiPageContent,
  EuiFieldSearch,
  EuiBasicTableColumn,
  EuiBasicTable,
  EuiSpacer,
  EuiEmptyPrompt,
  EuiCallOut,
} from '@elastic/eui';
import { gql } from '@apollo/client';
import { useThrottle, useDebounce } from 'react-use';
import { useQueryParam, StringParam } from 'use-query-params';
import { Link } from 'react-router-dom';

import DeletedItemBadge from '../DeletedItemBadge';

import { useSearchForObjectQuery, SearchForObjectQuery } from './ObjectSearch.queries';

export const SEARCH_FOR_OBJECTS = gql`
  query searchForObject($searchText: String!) {
    objects(searchText: $searchText) {
      __typename
      id
      resolvedName
      deletionReason
      deletionDate
      loadWithId
      containedById
    }
  }
`;

const renderObjectName = (name: string, item: any) => (
  <Link className="euiLink euiLink--primary" to={`/object/${item.id}`}>
    {name}
  </Link>
);

const renderObjectId = (objectId: string) => {
  if (parseInt(objectId) <= 0) return objectId;

  return (
    <Link className="euiLink euiLink--primary" to={`/object/${objectId}`}>
      {objectId}
    </Link>
  );
};

const renderDeletionBadge = (val: string, item: any) => {
  return <DeletedItemBadge deletionDate={item.deletionDate} deletionReason={item.deletionReason} />;
};

const objectColumns: EuiBasicTableColumn<SearchForObjectQuery['objects']>[] = [
  {
    field: 'id',
    name: 'Object ID',
    sortable: true,
    render: renderObjectId,
  },
  {
    field: 'resolvedName',
    name: 'Object Name',
    sortable: true,
    render: renderObjectName,
  },
  {
    field: 'deleted',
    name: 'Deletion Status',
    sortable: false,
    render: renderDeletionBadge,
  },
  {
    field: 'loadWithId',
    name: 'Loads With',
    sortable: false,
    render: renderObjectId,
  },
  {
    field: 'containedById',
    name: 'Contained By',
    sortable: false,
    render: renderObjectId,
  },
];

const ObjectSearch = () => {
  const [searchText, setSearchText] = useQueryParam('q', StringParam);
  const throttledSearchText = useThrottle(searchText || '');
  const { loading, error, data, previousData } = useSearchForObjectQuery({
    skip: throttledSearchText.trim().length === 0,
    variables: {
      searchText: throttledSearchText,
    },
    returnPartialData: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  useDebounce(
    () => {
      setIsLoading(loading);
    },
    200,
    [loading]
  );
  const actuallyLoading = isLoading && loading;
  const emptyMessage =
    throttledSearchText.length > 0 ? (
      'No objects found'
    ) : (
      <EuiEmptyPrompt iconType="search" title={<h3>Search to find objects</h3>} titleSize="s" />
    );

  return (
    <EuiPage paddingSize="l" restrictWidth>
      <EuiPageBody panelled borderRadius>
        <EuiPageHeader pageTitle="Object Search" paddingSize="s" />
        <EuiPageContent paddingSize="s" color="transparent" hasBorder={false}>
          <>
            <EuiFieldSearch
              placeholder="Search for objects, characters or accounts"
              value={searchText || ''}
              isClearable={!actuallyLoading}
              onChange={e => setSearchText((e.target as HTMLInputElement).value, 'replaceIn')}
              isLoading={actuallyLoading}
              fullWidth
            />
            <EuiSpacer />
            {error && (
              <>
                <EuiCallOut title="Search error" color="danger" iconType="alert">
                  <p>There was an error while querying. The results displayed may be incorrect.</p>
                </EuiCallOut>
                <EuiSpacer />
              </>
            )}
            <EuiBasicTable
              /* @ts-ignore */
              items={(Object.keys(data ?? {}).length > 0 ? data : previousData)?.objects ?? []}
              rowHeader="oid"
              columns={objectColumns}
              loading={actuallyLoading}
              noItemsMessage={emptyMessage}
            />
          </>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default ObjectSearch;
