import React from 'react';
import { EuiPage, EuiPageBody, EuiPageHeader, EuiPageContent } from '@elastic/eui';
import { gql } from '@apollo/client';
import { useParams } from 'react-router-dom';

import ObjectInfoWidget from '../widgets/ObjectInfoWidget';
import ContentsOfObject from '../widgets/ContentsOfObject';
import ExtraObjectInformation from '../widgets/ExtraInformation';

import { useGetObjectNameQuery } from './ObjectDetails.queries';

export const GET_OBJECT_NAME = gql`
  query getObjectName($id: String!) {
    object(objectId: $id) {
      __typename
      id
      resolvedName
    }
  }
`;

const ObjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data } = useGetObjectNameQuery({
    variables: {
      id,
    },
    returnPartialData: true,
  });

  return (
    <EuiPage paddingSize="l" restrictWidth>
      <EuiPageBody panelled borderRadius={10}>
        <EuiPageHeader pageTitle={data?.object?.resolvedName ?? 'Object details'} paddingSize="s" />
        <EuiPageContent paddingSize="none" color="transparent" hasBorder={false}>
          <ObjectInfoWidget objectId={id} />
          <ContentsOfObject objectId={id} />
          <ExtraObjectInformation objectId={id} />
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default ObjectDetails;
