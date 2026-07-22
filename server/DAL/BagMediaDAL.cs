using Microsoft.Data.SqlClient;
using RewearApi.BL;
using System;
using System.Collections.Generic;

namespace RewearApi.DAL
{
    public class BagMediaDAL : DBServices
    {
        private const string CON_STR_NAME =
            "RewearDB";

        private const string SP_ADD_BAG_MEDIA =
            "sp_AddBagMedia";


        public void AddBagMedia(BagMedia media)
        {
            using (SqlConnection con =
                   Connect(CON_STR_NAME))
            {
                var paramDic =
                    new Dictionary<string, object>
                    {
                        {
                            "@bag_id",
                            media.BagId
                        },
                        {
                            "@media_type",
                            media.MediaType
                        },
                        {
                            "@media_url",
                            media.MediaUrl
                        },
                        {
                            "@media_description",
                            (object?)media.MediaDescription
                            ?? DBNull.Value
                        }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_ADD_BAG_MEDIA,
                    con,
                    paramDic
                );

                cmd.ExecuteNonQuery();
            }
        }


        public List<string> GetMediaUrlsByBagId(
            int bagId
        )
        {
            List<string> mediaUrls =
                new List<string>();

            using (SqlConnection con =
                   Connect(CON_STR_NAME))
            {
                const string query = @"
                    SELECT media_url
                    FROM BagMedia
                    WHERE bag_id = @bag_id";

                using (SqlCommand cmd =
                       new SqlCommand(query, con))
                {
                    cmd.Parameters.AddWithValue(
                        "@bag_id",
                        bagId
                    );

                    using (SqlDataReader reader =
                           cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            if (
                                reader["media_url"]
                                != DBNull.Value
                            )
                            {
                                string? mediaUrl =
                                    reader["media_url"]
                                        .ToString();

                                if (
                                    !string.IsNullOrWhiteSpace(
                                        mediaUrl
                                    )
                                )
                                {
                                    mediaUrls.Add(mediaUrl);
                                }
                            }
                        }
                    }
                }
            }

            return mediaUrls;
        }


        public void DeleteMediaByBagId(
            int bagId
        )
        {
            using (SqlConnection con =
                   Connect(CON_STR_NAME))
            {
                const string query = @"
                    DELETE FROM BagMedia
                    WHERE bag_id = @bag_id";

                using (SqlCommand cmd =
                       new SqlCommand(query, con))
                {
                    cmd.Parameters.AddWithValue(
                        "@bag_id",
                        bagId
                    );

                    cmd.ExecuteNonQuery();
                }
            }
        }
    }
}