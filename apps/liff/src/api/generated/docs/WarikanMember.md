# WarikanMember


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** | Member ID (Doc ID) | [readonly] [default to undefined]
**projectId** | **string** | Parent Project ID | [readonly] [default to undefined]
**isGuest** | **boolean** |  | [readonly] [default to undefined]
**lineUserId** | **string** |  | [optional] [readonly] [default to undefined]
**displayName** | **string** |  | [default to undefined]
**balance** | **number** | 精算時の収支 | [default to undefined]
**addedAt** | **string** | ISO8601形式の日時文字列 (UTC) | [default to undefined]

## Example

```typescript
import { WarikanMember } from './api';

const instance: WarikanMember = {
    id,
    projectId,
    isGuest,
    lineUserId,
    displayName,
    balance,
    addedAt,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
