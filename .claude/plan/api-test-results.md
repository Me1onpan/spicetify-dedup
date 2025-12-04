# LikedSongs API 测试结果

**测试时间**: 2025-12-03
**Spotify 版本**: [1.2.77.358.g4339a634]
**Spicetify 版本**: [v2.42.3]

---

## 测试结果汇总

| API 名称                    | 可用性 | 响应时间 | 数据量 | addedAt               | 分页支持                                   | 稳定性 |
| --------------------------- | ------ | -------- | ------ | --------------------- | ------------------------------------------ | ------ |
| API A (core-collection)     | ❌     | 49.5ms   | 0 条   | ❌                    | ❌                                         | 0%     |
| API B (Platform.LibraryAPI) | ✅     | 22.7ms   | 50 条  | ✅(items[x].addedAt)  | ✅(totalLength 或者 unfilteredTotalLength) | 100%   |
| API C (Spotify Web API)     | ✅     | 2525.8ms | 50 条  | ✅(items[x].added_at) | ✅(total)                                  | 100%   |

---

## 详细测试数据

### API A: sp://core-collection/unstable/@/list/tracks

**响应示例**:

```json
[无法获取数据]
```

**优点**:

- 无法评估（API 不可用）

**缺点**:

- **致命缺陷**: 无法获取任何数据
- 可能是 API 端点已废弃或在当前 Spotify 版本中不可用
- 无法满足项目需求

---

### API B: Spicetify.Platform.LibraryAPI

**响应示例(items 只保留两项)**:

```json
{
  "items": [
    {
      "type": "track",
      "uri": "spotify:track:7hp8ZKzrRHFqq7bglyBMxx",
      "name": "真昼の月明かり",
      "duration": {
        "milliseconds": 221000
      },
      "album": {
        "type": "album",
        "uri": "spotify:album:1VT0ZKjq4T38hJqX815Dga",
        "name": "欠けた心象、世のよすが",
        "artist": {
          "type": "artist",
          "uri": "",
          "name": ""
        },
        "images": [
          {
            "url": "spotify:image:ab67616d00001e02a113e45b6f03eccf7c284d21",
            "label": "standard"
          },
          {
            "url": "spotify:image:ab67616d00004851a113e45b6f03eccf7c284d21",
            "label": "small"
          },
          {
            "url": "spotify:image:ab67616d0000b273a113e45b6f03eccf7c284d21",
            "label": "large"
          },
          {
            "url": "spotify:image:ab67616d0000b273a113e45b6f03eccf7c284d21",
            "label": "xlarge"
          }
        ],
        "year": 0,
        "albumType": "UNKNOWN"
      },
      "artists": [
        {
          "type": "artist",
          "uri": "spotify:artist:2mcj8ajoE1eFlNkAihw5Cg",
          "name": "Tsukuyomi"
        }
      ],
      "discNumber": 1,
      "trackNumber": 2,
      "isExplicit": false,
      "isPlayable": true,
      "isLocal": false,
      "is19PlusOnly": false,
      "addedAt": "2025-12-03T00:35:25.000Z",
      "hasAssociatedVideo": false,
      "hasAssociatedAudio": false,
      "isBanned": false
    },
    {
      "type": "track",
      "uri": "spotify:track:3zr2OmnUykMdfXPMO7JHbW",
      "name": "白幻花",
      "duration": {
        "milliseconds": 188000
      },
      "album": {
        "type": "album",
        "uri": "spotify:album:7i4ZPPF6mjfyJhWt2FIZbL",
        "name": "白幻花",
        "artist": {
          "type": "artist",
          "uri": "",
          "name": ""
        },
        "images": [
          {
            "url": "spotify:image:ab67616d00001e02dbdedf9b8103dd4e47a947ef",
            "label": "standard"
          },
          {
            "url": "spotify:image:ab67616d00004851dbdedf9b8103dd4e47a947ef",
            "label": "small"
          },
          {
            "url": "spotify:image:ab67616d0000b273dbdedf9b8103dd4e47a947ef",
            "label": "large"
          },
          {
            "url": "spotify:image:ab67616d0000b273dbdedf9b8103dd4e47a947ef",
            "label": "xlarge"
          }
        ],
        "year": 0,
        "albumType": "UNKNOWN"
      },
      "artists": [
        {
          "type": "artist",
          "uri": "spotify:artist:6UANXRxys3n1xkNv8dLRUp",
          "name": "HIBANA"
        }
      ],
      "discNumber": 1,
      "trackNumber": 1,
      "isExplicit": false,
      "isPlayable": true,
      "isLocal": false,
      "is19PlusOnly": false,
      "addedAt": "2025-12-03T00:11:32.000Z",
      "hasAssociatedVideo": false,
      "hasAssociatedAudio": false,
      "isBanned": false
    }
  ],
  "offset": 0,
  "limit": 50,
  "totalLength": 336,
  "unfilteredTotalLength": 336
}
```

**优点**:

- **🏆 性能优秀**: 响应时间仅 22.7ms，是三个候选 API 中最快的
- **数据完整**: 包含完整的歌曲信息（uri, name, artists, album, duration, addedAt 等）
- **分页支持良好**: 提供 `totalLength` 和 `unfilteredTotalLength` 双重总数字段
- **稳定性极佳**: 连续 5 次测试成功率 100%
- **数据结构清晰**: 直接返回 items 数组，易于解析
- **内置 API**: 无需额外认证，直接通过 Spicetify 调用
- **ISO 8601 时间格式**: `addedAt` 字段使用标准时间格式，便于排序和比较

**缺点**:

- **命名不统一**: 使用 camelCase（如 `addedAt`），与 Web API 的 snake_case 风格不一致
- **图片 URL 格式特殊**: 使用 `spotify:image:...` 格式而非标准 HTTPS URL
- **文档较少**: 作为 Spicetify 内部 API，官方文档不如 Web API 详细

---

### API C: Spotify Web API

**响应示例(items 只保留两项)**:

```json
{
  "href": "https://api.spotify.com/v1/me/tracks?offset=0&limit=50&locale=zh-Hani-CN,zh-Hans-CN;q%3D0.9,zh-CN;q%3D0.8,zh;q%3D0.7",
  "items": [
    {
      "added_at": "2025-12-03T00:35:25Z",
      "track": {
        "album": {
          "album_type": "album",
          "artists": [
            {
              "external_urls": {
                "spotify": "https://open.spotify.com/artist/2mcj8ajoE1eFlNkAihw5Cg"
              },
              "href": "https://api.spotify.com/v1/artists/2mcj8ajoE1eFlNkAihw5Cg",
              "id": "2mcj8ajoE1eFlNkAihw5Cg",
              "name": "Tsukuyomi",
              "type": "artist",
              "uri": "spotify:artist:2mcj8ajoE1eFlNkAihw5Cg"
            }
          ],
          "available_markets": ["JP"],
          "external_urls": {
            "spotify": "https://open.spotify.com/album/1VT0ZKjq4T38hJqX815Dga"
          },
          "href": "https://api.spotify.com/v1/albums/1VT0ZKjq4T38hJqX815Dga",
          "id": "1VT0ZKjq4T38hJqX815Dga",
          "images": [
            {
              "height": 640,
              "width": 640,
              "url": "https://i.scdn.co/image/ab67616d0000b273a113e45b6f03eccf7c284d21"
            },
            {
              "height": 300,
              "width": 300,
              "url": "https://i.scdn.co/image/ab67616d00001e02a113e45b6f03eccf7c284d21"
            },
            {
              "height": 64,
              "width": 64,
              "url": "https://i.scdn.co/image/ab67616d00004851a113e45b6f03eccf7c284d21"
            }
          ],
          "is_playable": true,
          "name": "欠けた心象、世のよすが",
          "release_date": "2021-09-08",
          "release_date_precision": "day",
          "total_tracks": 8,
          "type": "album",
          "uri": "spotify:album:1VT0ZKjq4T38hJqX815Dga"
        },
        "artists": [
          {
            "external_urls": {
              "spotify": "https://open.spotify.com/artist/2mcj8ajoE1eFlNkAihw5Cg"
            },
            "href": "https://api.spotify.com/v1/artists/2mcj8ajoE1eFlNkAihw5Cg",
            "id": "2mcj8ajoE1eFlNkAihw5Cg",
            "name": "Tsukuyomi",
            "type": "artist",
            "uri": "spotify:artist:2mcj8ajoE1eFlNkAihw5Cg"
          }
        ],
        "available_markets": ["JP"],
        "disc_number": 1,
        "duration_ms": 221200,
        "explicit": false,
        "external_ids": {
          "isrc": "JPVI02101280"
        },
        "external_urls": {
          "spotify": "https://open.spotify.com/track/7hp8ZKzrRHFqq7bglyBMxx"
        },
        "href": "https://api.spotify.com/v1/tracks/7hp8ZKzrRHFqq7bglyBMxx",
        "id": "7hp8ZKzrRHFqq7bglyBMxx",
        "is_local": false,
        "is_playable": true,
        "name": "真昼の月明かり",
        "popularity": 39,
        "preview_url": "https://p.scdn.co/mp3-preview/9857d965751e49a9c290e4444ed9853703b5fbe3?cid=65b708073fc0480ea92a077233ca87bd",
        "track_number": 2,
        "type": "track",
        "uri": "spotify:track:7hp8ZKzrRHFqq7bglyBMxx"
      }
    },
    {
      "added_at": "2025-12-03T00:11:32Z",
      "track": {
        "album": {
          "album_type": "single",
          "artists": [
            {
              "external_urls": {
                "spotify": "https://open.spotify.com/artist/6UANXRxys3n1xkNv8dLRUp"
              },
              "href": "https://api.spotify.com/v1/artists/6UANXRxys3n1xkNv8dLRUp",
              "id": "6UANXRxys3n1xkNv8dLRUp",
              "name": "HIBANA",
              "type": "artist",
              "uri": "spotify:artist:6UANXRxys3n1xkNv8dLRUp"
            }
          ],
          "available_markets": ["JP"],
          "external_urls": {
            "spotify": "https://open.spotify.com/album/7i4ZPPF6mjfyJhWt2FIZbL"
          },
          "href": "https://api.spotify.com/v1/albums/7i4ZPPF6mjfyJhWt2FIZbL",
          "id": "7i4ZPPF6mjfyJhWt2FIZbL",
          "images": [
            {
              "height": 640,
              "width": 640,
              "url": "https://i.scdn.co/image/ab67616d0000b273dbdedf9b8103dd4e47a947ef"
            },
            {
              "height": 300,
              "width": 300,
              "url": "https://i.scdn.co/image/ab67616d00001e02dbdedf9b8103dd4e47a947ef"
            },
            {
              "height": 64,
              "width": 64,
              "url": "https://i.scdn.co/image/ab67616d00004851dbdedf9b8103dd4e47a947ef"
            }
          ],
          "is_playable": true,
          "name": "白幻花",
          "release_date": "2025-08-11",
          "release_date_precision": "day",
          "total_tracks": 1,
          "type": "album",
          "uri": "spotify:album:7i4ZPPF6mjfyJhWt2FIZbL"
        },
        "artists": [
          {
            "external_urls": {
              "spotify": "https://open.spotify.com/artist/6UANXRxys3n1xkNv8dLRUp"
            },
            "href": "https://api.spotify.com/v1/artists/6UANXRxys3n1xkNv8dLRUp",
            "id": "6UANXRxys3n1xkNv8dLRUp",
            "name": "HIBANA",
            "type": "artist",
            "uri": "spotify:artist:6UANXRxys3n1xkNv8dLRUp"
          }
        ],
        "available_markets": ["JP"],
        "disc_number": 1,
        "duration_ms": 188307,
        "explicit": false,
        "external_ids": {
          "isrc": "TCJPK2547219"
        },
        "external_urls": {
          "spotify": "https://open.spotify.com/track/3zr2OmnUykMdfXPMO7JHbW"
        },
        "href": "https://api.spotify.com/v1/tracks/3zr2OmnUykMdfXPMO7JHbW",
        "id": "3zr2OmnUykMdfXPMO7JHbW",
        "is_local": false,
        "is_playable": true,
        "name": "白幻花",
        "popularity": 27,
        "preview_url": "https://p.scdn.co/mp3-preview/949937a6f2f480535e4e237fccb1eb282ad859b3?cid=65b708073fc0480ea92a077233ca87bd",
        "track_number": 1,
        "type": "track",
        "uri": "spotify:track:3zr2OmnUykMdfXPMO7JHbW"
      }
    }
  ],
  "limit": 50,
  "next": "https://api.spotify.com/v1/me/tracks?offset=50&limit=50&locale=zh-Hani-CN,zh-Hans-CN;q%3D0.9,zh-CN;q%3D0.8,zh;q%3D0.7",
  "offset": 0,
  "previous": null,
  "total": 336
}
```

**优点**:

- **数据完整度最高**: 提供了最丰富的元数据（popularity, preview_url, external_ids, available_markets 等）
- **标准化接口**: 使用标准的 RESTful API 和 snake_case 命名规范，符合业界最佳实践
- **官方文档完善**: 作为 Spotify 官方 Web API，拥有详尽的官方文档和社区支持
- **HTTPS 图片 URL**: 图片链接使用标准的 HTTPS URL 格式，便于直接在网页中使用
- **稳定性良好**: 连续 5 次测试成功率 100%，数据一致性有保障
- **ISO 8601 时间格式**: `added_at` 字段使用标准时间格式，便于跨平台处理

**缺点**:

- **🐌 性能严重不足**: 响应时间高达 2525.8ms，是 API B 的 **111 倍**，用户体验极差
- **网络依赖**: 需要通过互联网访问 Spotify 服务器，受网络状况影响大
- **可能需要认证**: 虽然通过 CosmosAsync 调用时自动处理，但在其他场景可能需要额外的 OAuth 认证
- **数据冗余**: 返回了大量项目可能不需要的字段（如 external_urls, href），增加传输和解析成本
- **响应延迟高**: 2.5 秒的延迟在用户交互场景中完全不可接受

---

## 推荐结论

**🏆 强烈推荐使用**: API B (Spicetify.Platform.LibraryAPI)

**理由**:

1. **性能卓越** 🚀

   - 响应时间仅 22.7ms，是 API C (Web API) 的 1/111
   - 在需要频繁查询的查重场景中，这个性能优势至关重要
   - 用户体验流畅，几乎无感知延迟

2. **数据完整性充分** ✅

   - 包含所有必需字段：`uri`, `name`, `artists`, `album`, `addedAt`, `duration`
   - 提供准确的分页信息：`totalLength` 和 `unfilteredTotalLength`
   - `addedAt` 字段使用标准 ISO 8601 格式，便于时间排序

3. **稳定性极佳** 💪

   - 连续 5 次测试成功率 100%
   - 作为 Spicetify 内置 API，无需额外认证
   - 不受网络状况影响，本地调用更可靠

4. **开发体验友好** 😊
   - 直接通过 `Spicetify.Platform.LibraryAPI` 调用，代码简洁
   - 无需处理复杂的 Web API 认证流程
   - 数据结构清晰，易于解析和使用

**注意事项**:

- ⚠️ **API 稳定性**: 该 API 属于 Spicetify 内部接口，虽然目前稳定，但未来 Spotify 更新可能影响其可用性，建议做好降级方案（fallback 到 Web API）
- 📝 **命名风格**: API 使用 camelCase（如 `addedAt`），与 Web API 的 snake_case 不一致，团队需统一命名规范
- 🖼️ **图片处理**: 图片 URL 使用 `spotify:image:...` 格式，如需在 HTML 中显示需要转换，可通过以下方式处理：
  ```typescript
  const imageUrl = imageUri.replace(
    "spotify:image:",
    "https://i.scdn.co/image/"
  );
  ```
- 🔄 **版本兼容性**: 定期测试不同 Spotify 版本下的 API 可用性，建议在 CI/CD 中加入兼容性检查
- 💾 **缓存策略**: 虽然 API 响应快，但仍建议实现合理的缓存机制（如 3 分钟缓存），减少不必要的调用

---

## 测试执行步骤回顾

✅ 步骤检查清单：

- [x] 打开 Spotify 并启用扩展
- [x] 打开 DevTools Console (Ctrl+Shift+I)
- [x] 观察测试日志输出
- [x] 记录表格形式的测试结果
- [x] 记录稳定性测试结果
- [x] 检查每个 API 返回的数据结构
- [x] 验证 addedAt 字段是否存在
- [x] 分析性能差异并得出结论
- [x] 完成测试报告文档

---

**测试完成时间**: 2025-12-03
