// server/DAL/AssociationDAL.cs
//
// Change from original:
//   - Added RegisterOrganization(RegisterOrgDto dto) method.
//     Calls sp_RegisterOrganization and returns a User object
//     so the controller can send it straight back to React.
//   - All existing methods and the private MapAssociation helper
//     are preserved exactly — zero changes to their logic.

using Microsoft.Data.SqlClient;
using RewearApi.BL;
using System;
using System.Collections.Generic;

namespace RewearApi.DAL
{
    public class AssociationDAL : DBServices
    {
        private const string CON_STR_NAME = "RewearDB";

        private const string SP_CHECK_ASSOCIATION_EXISTS        = "sp_CheckAssociationExists";
        private const string SP_CREATE_ASSOCIATION              = "sp_CreateAssociation";
        private const string SP_UPDATE_ASSOCIATION_SETTINGS     = "sp_UpdateAssociationSettings";
        private const string SP_UPDATE_ASSOCIATION_AVAILABILITY = "sp_UpdateAssociationAvailability";
private const string SP_REGISTER_ORGANIZATION = "dbo.sp_RegisterOrganization";
        // ── New method ───────────────────────────────────────────────────

        /// <summary>
        /// Calls sp_RegisterOrganization which:
        ///   1. Inserts a Users row (user_type = 'Association')
        ///   2. Inserts an Associations row linked via user_id
        ///   3. Returns the new Users row (same shape as sp_LoginUser)
        /// If either insert fails the SP rolls back both and re-raises
        /// the error, which surfaces here as a SqlException.
        /// </summary>
        /// <returns>
        /// A User object populated with the new user_id and fields —
        /// ready to be stored in UserContext on the React side.
        /// </returns>
        public User RegisterOrganization(RegisterOrgDto dto)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    string? causeCsv = (dto.CauseIds != null && dto.CauseIds.Count > 0)
                        ? string.Join(",", dto.CauseIds)
                        : null;

                    string? categoryCsv = (dto.AcceptedCategoryIds != null && dto.AcceptedCategoryIds.Count > 0)
                        ? string.Join(",", dto.AcceptedCategoryIds)
                        : null;

                    var paramDic = new Dictionary<string, object>
                    {
                        { "@full_name",          dto.FullName              },
                        { "@email",              dto.Email                 },
                        { "@user_password",      dto.Password              },
                        { "@phone",              (object?)dto.Phone     ?? DBNull.Value },
                        { "@location",           (object?)dto.City      ?? DBNull.Value },
                        { "@association_name",   dto.AssociationName       },
                        { "@org_number",         (object?)dto.OrgNumber ?? DBNull.Value },
                        { "@address",            dto.Address               },
                        { "@city",               (object?)dto.City      ?? DBNull.Value },
                        { "@work_mode",          dto.WorkMode              },
                        { "@delivery_mode",      dto.DeliveryMode          },
                        { "@cause_ids_csv",      (object?)causeCsv      ?? DBNull.Value },
                        { "@category_ids_csv",   (object?)categoryCsv   ?? DBNull.Value },
                    };

                    SqlCommand cmd = CreateCommand(SP_REGISTER_ORGANIZATION, con, paramDic);

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
                throw new Exception("sp_RegisterOrganization committed but returned no user row.");
            }
            catch (Exception)
            {
                throw;
            }
        }

        // ── New method ───────────────────────────────────────────────────

        /// <summary>
        /// Returns every association (available or not) as AssociationListItemDto,
        /// including their Causes (AssociationCauses) and AcceptedCategories
        /// (AssociationCategories). CurrentNeeds has no backing source yet, so it
        /// is always returned as an empty list — same for Latitude/Longitude
        /// (null), there is no geocoding data in the schema.
        /// </summary>
        public List<AssociationListItemDto> GetAll()
        {
            try
            {
                var results = new List<AssociationListItemDto>();

                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    using (SqlCommand cmd = new SqlCommand(
                        "SELECT association_id, association_name, association_type, " +
                        "city, area, email, delivery_mode, is_available, created_at " +
                        "FROM Associations ORDER BY association_name", con))
                    {
                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                results.Add(new AssociationListItemDto
                                {
                                    Id                 = Convert.ToInt32(reader["association_id"]),
                                    Name               = reader["association_name"].ToString()!,
                                    Email              = reader["email"].ToString()!,
                                    City               = reader["city"] == DBNull.Value
                                                             ? null : reader["city"].ToString(),
                                    Area               = reader["area"] == DBNull.Value
                                                             ? null : reader["area"].ToString(),
                                    DeliveryMode       = reader["delivery_mode"].ToString()!,
                                    IsAvailableDefault = Convert.ToBoolean(reader["is_available"]),
                                    JoinedAt           = Convert.ToDateTime(reader["created_at"])
                                                             .ToString("o"),
                                    Types              = reader["association_type"] == DBNull.Value
                                                             ? null : reader["association_type"].ToString(),
                                    Latitude           = null,
                                    Longitude          = null,
                                });
                            }
                        }
                    }

                    // Bucket AssociationCauses rows into a dictionary so each
                    // association gets its causes without N+1 queries.
                    var causesByAssoc = new Dictionary<int, List<string>>();
                    using (SqlCommand cmd = new SqlCommand(
                        "SELECT association_id, cause_id FROM AssociationCauses", con))
                    {
                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                int aid = Convert.ToInt32(reader["association_id"]);
                                if (!causesByAssoc.TryGetValue(aid, out var list))
                                    causesByAssoc[aid] = list = new List<string>();
                                list.Add(reader["cause_id"].ToString()!);
                            }
                        }
                    }

                    foreach (var a in results)
                        if (causesByAssoc.TryGetValue(a.Id, out var list))
                            a.Causes = list;

                    // Bucket AssociationCategories rows the same way — CurrentNeeds
                    // stays empty, there is no backing source for it yet.
                    var categoriesByAssoc = new Dictionary<int, List<string>>();
                    using (SqlCommand cmd = new SqlCommand(
                        "SELECT association_id, category_id FROM AssociationCategories", con))
                    {
                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                int aid = Convert.ToInt32(reader["association_id"]);
                                if (!categoriesByAssoc.TryGetValue(aid, out var list))
                                    categoriesByAssoc[aid] = list = new List<string>();
                                list.Add(reader["category_id"].ToString()!);
                            }
                        }
                    }

                    foreach (var a in results)
                        if (categoriesByAssoc.TryGetValue(a.Id, out var list))
                            a.AcceptedCategories = list;
                }

                return results;
            }
            catch (Exception)
            {
                throw;
            }
        }

        // ── Existing methods — unchanged ─────────────────────────────────

        public Association? CheckAssociationExists(string name, string email)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@association_name", name  },
                        { "@email",            email }
                    };

                    SqlCommand cmd = CreateCommand(SP_CHECK_ASSOCIATION_EXISTS, con, paramDic);

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                            return MapAssociationBasic(reader);
                    }
                }

                return null;
            }
            catch (Exception)
            {
                throw;
            }
        }

        public void CreateAssociation(Association association)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@association_name",     association.AssociationName                              },
                        { "@association_type",     (object?)association.AssociationType ?? DBNull.Value     },
                        { "@address",              association.Address                                       },
                        { "@city",                 (object?)association.City            ?? DBNull.Value     },
                        { "@area",                 (object?)association.Area            ?? DBNull.Value     },
                        { "@email",                association.Email                                         },
                        { "@phone",                (object?)association.Phone           ?? DBNull.Value     },
                        { "@description",          (object?)association.Description     ?? DBNull.Value     },
                        { "@donation_destination", (object?)association.DonationDestination ?? DBNull.Value },
                        { "@receiving_hours",      (object?)association.ReceivingHours  ?? DBNull.Value     },
                        { "@work_mode",            association.WorkMode                                      },
                        { "@delivery_mode",        association.DeliveryMode                                  },
                        { "@is_available",         association.IsAvailable                                   }
                    };

                    SqlCommand cmd = CreateCommand(SP_CREATE_ASSOCIATION, con, paramDic);
                    cmd.ExecuteNonQuery();
                }
            }
            catch (Exception)
            {
                throw;
            }
        }

        public void UpdateAssociationSettings(Association association)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@association_id",       association.AssociationId                                 },
                        { "@association_name",     association.AssociationName                               },
                        { "@association_type",     (object?)association.AssociationType  ?? DBNull.Value     },
                        { "@address",              association.Address                                        },
                        { "@city",                 (object?)association.City             ?? DBNull.Value     },
                        { "@area",                 (object?)association.Area             ?? DBNull.Value     },
                        { "@email",                association.Email                                          },
                        { "@phone",                (object?)association.Phone            ?? DBNull.Value     },
                        { "@description",          (object?)association.Description      ?? DBNull.Value     },
                        { "@donation_destination", (object?)association.DonationDestination ?? DBNull.Value  },
                        { "@receiving_hours",      (object?)association.ReceivingHours   ?? DBNull.Value     },
                        { "@work_mode",            association.WorkMode                                       },
                        { "@delivery_mode",        association.DeliveryMode                                   },
                        { "@is_available",         association.IsAvailable                                    }
                    };

                    SqlCommand cmd = CreateCommand(SP_UPDATE_ASSOCIATION_SETTINGS, con, paramDic);
                    cmd.ExecuteNonQuery();
                }
            }
            catch (Exception)
            {
                throw;
            }
        }

        public void UpdateAssociationAvailability(int associationId, bool isAvailable)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@association_id", associationId },
                        { "@is_available",   isAvailable   }
                    };

                    SqlCommand cmd = CreateCommand(SP_UPDATE_ASSOCIATION_AVAILABILITY, con, paramDic);
                    cmd.ExecuteNonQuery();
                }
            }
            catch (Exception)
            {
                throw;
            }
        }

        /// <summary>
        /// Lightweight mapper for CheckAssociationExists only — reads exactly
        /// the columns sp_CheckAssociationExists selects (association_id,
        /// association_name, email, is_available). Mirrors
        /// StoreDAL.MapStoreBasic(). Do not widen this to read columns the
        /// stored procedure doesn't select — a full-object mapper reading
        /// columns this SP never returned was the root cause of this
        /// endpoint's 500s. If a future caller needs more fields, add them
        /// to both the SP's SELECT and this mapper together.
        /// </summary>
        private Association MapAssociationBasic(SqlDataReader reader)
        {
            var a = new Association();

            a.AssociationId   = Convert.ToInt32(reader["association_id"]);
            a.AssociationName = reader["association_name"].ToString()!;
            a.Email           = reader["email"].ToString()!;
            a.IsAvailable     = Convert.ToBoolean(reader["is_available"]);

            return a;
        }
    }
}