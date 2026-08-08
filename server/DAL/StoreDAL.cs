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
        private const string SP_REGISTER_STORE = "sp_RegisterStore";

        // ── New method ───────────────────────────────────────────────────

        /// <summary>
        /// Calls sp_RegisterStore which:
        ///   1. Inserts a Users row (user_type = 'Store')
        ///   2. Inserts a SecondHandStores row linked via user_id
        ///   3. Returns the new Users row (same shape as sp_LoginUser)
        /// If either insert fails the SP rolls back both and re-raises
        /// the error, which surfaces here as a SqlException.
        /// </summary>
        /// <returns>
        /// A User object populated with the new user_id and fields —
        /// ready to be stored in UserContext on the React side.
        /// </returns>
        public User RegisterStore(RegisterStoreDto dto)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@full_name",     dto.FullName                 },
                        { "@email",         dto.Email                    },
                        { "@user_password", dto.Password                 },
                        { "@phone",         (object?)dto.Phone        ?? DBNull.Value },
                        { "@location",      (object?)dto.City         ?? DBNull.Value },
                        { "@store_name",    dto.StoreName                },
                        { "@address",       dto.Address                  },
                        { "@city",          (object?)dto.City         ?? DBNull.Value },
                        { "@area",          (object?)dto.Area         ?? DBNull.Value },
                        { "@description",   (object?)dto.Description  ?? DBNull.Value },
                    };

                    SqlCommand cmd = CreateCommand(SP_REGISTER_STORE, con, paramDic);

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            // Map the returned Users row — identical column list
                            // to sp_LoginUser so no mapper duplication.
                            return new User
                            {
                                UserId             = Convert.ToInt32(reader["user_id"]),
                                FullName           = reader["full_name"].ToString()!,
                                Username           = reader["username"].ToString()!,
                                Email              = reader["email"].ToString()!,
                                Phone              = reader["phone"]    == DBNull.Value
                                                         ? null : reader["phone"].ToString(),
                                City               = reader["location"] == DBNull.Value
                                                         ? null : reader["location"].ToString(),
                                RegistrationMethod = reader["signup_method"].ToString()!,
                                UserType           = reader["user_type"].ToString()!,
                            };
                        }
                    }
                }

                // The SP committed but returned no row — should not happen
                // unless the SP is altered to omit the final SELECT.
                throw new Exception("sp_RegisterStore committed but returned no user row.");
            }
            catch (Exception)
            {
                throw;
            }
        }

        // ── Existing methods — unchanged ─────────────────────────────────

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