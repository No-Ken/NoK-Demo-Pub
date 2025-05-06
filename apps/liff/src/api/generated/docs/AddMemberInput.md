# AddMemberInput


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**displayName** | **string** | メンバーの表示名 | [default to undefined]
**lineUserId** | **string** | LINEユーザーID (ゲストでない場合) | [optional] [default to undefined]
**isGuest** | **boolean** | ゲストユーザーかどうか (lineUserIdがあればfalse) | [optional] [readonly] [default to undefined]

## Example

```typescript
import { AddMemberInput } from './api';

const instance: AddMemberInput = {
    displayName,
    lineUserId,
    isGuest,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
