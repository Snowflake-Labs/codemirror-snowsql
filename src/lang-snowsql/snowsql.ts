

import { parser } from 'lezer-snowsql';
import { styleTags, tags } from '@codemirror/highlight';
import { Extension } from '@codemirror/state';
import { CompleteConfiguration, CompleteStrategy, newCompleteStrategy } from './complete';
import { LintStrategy, newLintStrategy, snowSQLLinter } from './lint';
import { CompletionContext } from '@codemirror/autocomplete';
import { LezerLanguage } from '@codemirror/language';

export const snowSQLLanguage = LezerLanguage.define({
  parser: parser.configure({
    props: [
      styleTags({
        LineComment: tags.comment,
        LabelName: tags.labelName,
        StringLiteral: tags.string,
        NumberLiteral: tags.number, 
        Duration: tags.number,
        'Abs Absent Drop  IP Something Policy AbsentOverTime AvgOverTime Ceil Changes Clamp ClampMax ClampMin CountOverTime DaysInMonth DayOfMonth DayOfWeek Delta Deriv Exp Floor HistogramQuantile HoltWinters Hour Idelta Increase Irate LabelReplace LabelJoin LastOverTime Ln Log10 Log2 MaxOverTime MinOverTime Minute Month PredictLinear QuantileOverTime Rate Resets Round Scalar Sgn Sort SortDesc Sqrt StddevOverTime StdvarOverTime SumOverTime Time Timestamp Vector Year': tags.function(
          tags.variableName
        ),
        'Aad_provisioner Abort_detached_query Abort_statement Access Account Admin Admin_name Admin_password After Allow_duplicate Allow_overlapping_execution Allowed_IP_List And Api Api_allowed_prefixes Api_aws_role_arn Api_blocked_prefixes Api_integration Api_key Api_provider As At Auto Auto_ingest Auto_refresh Auto_refresh_materialized_views_on_secondary Auto_resume Auto_suspend Autocommit Autoincrement Avro Aws_api_gateway Aws_cse Aws_key_id Aws_private_api_gateway Aws_role Aws_secret_key Aws_sns_topic Aws_sse_kms Aws_sse_s3 Aws_token Azure Azure_ad_application_id Azure_api_management Azure_cse Azure_sas_token Azure_storage_queue Azure_storage_queue_primary_uri Azure_tenant_id Base64 Before Between Binary_as_text Binary_format Binary_input_format Binary_output_format Blob Blocked_IP_List Blocked_roles_list Bool Boolean Brotli Business Business_critical By Bz2 Called Caller Cascade Case_insensitive Case_sensitive Change Change_tracking Clone Cluster Collate Columns Comment Compression Confidential Constraint Context_headers Continue Copy Copy_options Copyoptions Core Create Credentials Credit_quota Critical Cron Csv Custom Daily Data Data_retention_time_in_days Database Date_format Date_input_format Date_output_format Days_to_expiry Default Default_ddl_collation Default_namespace Default_role Default_warehouse Deflate Desc Describe Disable Disable_auto_convert Disable_snowflake_data Disabled Display_name Do Drop Economy Edition Email Email_address Empty_field_as_null Enable Enable_for_privilege Enable_octal Enabled Encoding Encryption End_timestamp Enforce_length Enterprise Error_on_column_count_mismatch Error_on_nondeterministic_merge Error_on_nondeterministic_update Escape Escape_unenclosed_field Execute Exists External External_oauth External_oauth_any_role_mode External_oauth_audience_list External_oauth_issuer External_oauth_jws_keys_url External_oauth_rsa_public_key External_oauth_rsa_public_key_2 External_oauth_snowflake_user_mapping_attribute External_oauth_token_user_mapping_claim External_oauth_type Externalstage False Field_delimiter Field_optionally_enclosed_by File File_extension File_format First First_name For Force Foreign Format Format_name Formattypeoptions Frequency From Function Gcp_pubsub Gcp_pubsub_subscription_name Gcs Gcs_sse_kms Generic_scim_provisioner Global Google_api_gateway Google_audience Grants GroupLeft GroupRight Gzip Headers Hex IP Identity If Ignore_utf8_errors Ignoring Immediately Immutable In Increment Initially_suspended Input Integration Is Javascript Json Json_indent Key Kms_key_id Language Large Last Last_name Like List Local Location Lock_timeout Login_name Lzo Managed Masking Master_key Match_by_column_name Materialized Max_batch_rows Max_cluster_count Max_concurrency_level Max_data_extension_time_in_days Medium Middle_name Min_cluster_count Mins_to_bypass_mfa Mins_to_unlock Minute Monitor Monthly Must Must_change_password Name Net Network Network_policy Never None Not Notification Notification_provider Notify Null Null_if Numeric Oauth Oauth_allow_non_tls_redirect_uri Oauth_client Oauth_client_rsa_public_key Oauth_client_rsa_public_key_2 Oauth_client_type Oauth_enforce_pkce Oauth_issue_refresh_tokens Oauth_redirect_uri Oauth_refresh_token_validity Of Offset Okta Okta_provisioner On On_error Only Or Orc Owner Parquet Partition Password Pattern Percent Ping_federate Pipe Policy Pre_authorized_roles_list Preserve_space Primary Procedure Public Purge Query_tag Queue Raw_deflate Reader Record_delimiter Recursive References Refresh_on_create Region Region_group Replace Replace_invalid_characters Replica Resource Resource_monitor Restrict Return_failed_only Returns Ribe Role Row Rows_per_resultset Rsa_public_key Rsa_public_key_2 Run_as_role S3 Saml2 Saml2_enable_sp_initiated Saml2_force_authn Saml2_issuer Saml2_post_logout_redirect_url Saml2_provider Saml2_requested_nameid_format Saml2_sign_request Saml2_snowflake_acs_url Saml2_snowflake_issuer_url Saml2_snowflake_x509_cert Saml2_sp_initiated_login_page_label Saml2_sso_url Saml2_x509_cert Scaling_policy Schedule Schema Scim Scim_client Secure Security Select Sequence Share Simulated_data_sharing_consumer Size_limit Skip_blank_lines Skip_byte_order_mark Skip_file Skip_header Small Snappy Snappy_compression Snowflake_support Stage Stage_copy_options Stage_file_format Standard Start Start_timestamp Statement Statement_queued_timeout_in_seconds Statement_timeout_in_seconds Storage Storage_integration Strict Strict_json_output Strip_null_values Strip_outer_array Strip_outer_element Supported Suspend Suspend_immediate Table Task Temporary Text Time_format Time_input_format Time_output_format Timestamp Timestamp_day_is_always_24h Timestamp_format Timestamp_input_format Timestamp_ltz_output_format Timestamp_ntz_output_format Timestamp_output_format Timestamp_type_mapping Timestamp_tz_output_format Timezone Transaction_default_isolation_level Transient Triggers Trim_space True Truncatecolumns Two_digit_century_start Type Types Unique Unsupported_ddl_action Url Use_cached_result User User_task_timeout_ms Using Utf8 Validate_utf8 View Volatile Warehouse Warehouse_size Week_of_year_policy Week_start Weekly When Where Windows With X4large Xlarge Xml Xsmall Xxlarge Xxxlarge Yearly Zstd': tags.operatorKeyword,
        'By Without Table Dash Stage Allowed IP Bool On Ignoring GroupLeft GroupRight Offset Start End': tags.modifier,
        'And Unless Or': tags.logicOperator,
        'Sub Add Type  Network Policy  Mod Div Eql Neq Lte Lss Gte Gtr EqlRegex EqlSingle NeqRegex Pow At': tags.operator,
        UnaryOp: tags.arithmeticOperator,
        '( )': tags.paren,
        '[ ]': tags.squareBracket,
        '{ }': tags.brace,
        '⚠': tags.invalid,
      }),
    ],
  }),
  languageData: {
    closeBrackets: { brackets: ['(', '[', '{', "'", '"', '`'] },
    commentTokens: { line: '#' },
  },
});

/**
 * This class holds the state of the completion extension for CodeMirror and allow hot-swapping the complete strategy.
 */
export class snowSQLExtension {
  private complete: CompleteStrategy;
  private lint: LintStrategy;
  private enableCompletion: boolean;
  private enableLinter: boolean;

  constructor() {
    this.complete = newCompleteStrategy();
    this.lint = newLintStrategy();
    this.enableLinter = true;
    this.enableCompletion = true;
  }

  setComplete(conf?: CompleteConfiguration): snowSQLExtension {
    this.complete = newCompleteStrategy(conf);
    return this;
  }

  getComplete(): CompleteStrategy {
    return this.complete;
  }

  activateCompletion(activate: boolean): snowSQLExtension {
    this.enableCompletion = activate;
    return this;
  }

  setLinter(linter: LintStrategy): snowSQLExtension {
    this.lint = linter;
    return this;
  }

  getLinter(): LintStrategy {
    return this.lint;
  }

  activateLinter(activate: boolean): snowSQLExtension {
    this.enableLinter = activate;
    return this;
  }

  asExtension(): Extension {
    let extension: Extension = [snowSQLLanguage];
    if (this.enableCompletion) {
      const completion = snowSQLLanguage.data.of({
        autocomplete: (context: CompletionContext) => {
          return this.complete.snowSQL(context);
        },
      });
      extension = extension.concat(completion);
    }
    if (this.enableLinter) {
      extension = extension.concat(snowSQLLinter(this.lint.snowSQL, this.lint));
    }
    return extension;
  }
}
