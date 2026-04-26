using Microsoft.Data.SqlClient;
using RewearApi.BL;
using System;
using System.Collections.Generic;

namespace RewearApi.DAL
{
    public class StoreDAL : DBServices
    {
        private const string CON_STR_NAME = "RewearDB";

        private const string SP_CHECK_STORE_EXISTS = "sp_CheckStoreExists";
        private const string SP_CREATE_STORE = "sp_CreateStore";
        private const string SP_GET_NEARBY_STORES_FOR_ASSOCIATION = "sp_GetNearbyStoresForAssociation";

        public Store? CheckStoreExists(string storeName, string email)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@store_name", storeName },
                        { "@email", email }
                    };

                    SqlCommand cmd = CreateCommand(SP_CHECK_STORE_EXISTS, con, paramDic);

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return MapStoreBasic(reader);
                        }
                    }
                }

                return null;
            }
            catch (Exception)
            {
                throw;
            }
        }

        public void CreateStore(Store store)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@store_name", store.StoreName },
                        { "@address", store.Address },
                        { "@city", (object?)store.City ?? DBNull.Value },
                        { "@area", (object?)store.Area ?? DBNull.Value },
                        { "@email", store.Email },
                        { "@phone", (object?)store.Phone ?? DBNull.Value },
                        { "@description", (object?)store.Description ?? DBNull.Value }
                    };

                    SqlCommand cmd = CreateCommand(SP_CREATE_STORE, con, paramDic);
                    cmd.ExecuteNonQuery();
                }
            }
            catch (Exception)
            {
                throw;
            }
        }

        public List<Store> GetNearbyStoresForAssociation(int associationId)
        {
            List<Store> stores = new List<Store>();

            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@association_id", associationId }
                    };

                    SqlCommand cmd = CreateCommand(SP_GET_NEARBY_STORES_FOR_ASSOCIATION, con, paramDic);

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            stores.Add(MapStoreFull(reader));
                        }
                    }
                }

                return stores;
            }
            catch (Exception)
            {
                throw;
            }
        }

        private Store MapStoreBasic(SqlDataReader reader)
        {
            Store s = new Store();

            s.StoreId = Convert.ToInt32(reader["store_id"]);
            s.StoreName = reader["store_name"].ToString()!;
            s.Email = reader["email"].ToString()!;

            return s;
        }

        private Store MapStoreFull(SqlDataReader reader)
        {
            Store s = new Store();

            s.StoreId = Convert.ToInt32(reader["store_id"]);
            s.StoreName = reader["store_name"].ToString()!;
            s.Address = reader["address"].ToString()!;
            s.City = reader["city"] == DBNull.Value ? null : reader["city"].ToString();
            s.Area = reader["area"] == DBNull.Value ? null : reader["area"].ToString();
            s.Email = reader["email"].ToString()!;
            s.Phone = reader["phone"] == DBNull.Value ? null : reader["phone"].ToString();
            s.Description = reader["description"] == DBNull.Value ? null : reader["description"].ToString();
            s.CreatedAt = Convert.ToDateTime(reader["created_at"]);

            return s;
        }
    }
}